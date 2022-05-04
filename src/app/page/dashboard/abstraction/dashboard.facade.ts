import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { realm } from 'src/app/core/api/api.service.properties';
import { View } from 'src/app/shared/model/view.model';
import { DashboardService } from '../core/dashboard.service';
import { DashboardState } from '../core/dashboard.state';
import { Dashboard } from '../model/dashboard.model';

@Injectable()
export class DashboardFacade {
  constructor(private dashboardService: DashboardService, private dashboardState: DashboardState) {}

  get numberOfParts$(): Observable<View<number>> {
    return this.dashboardState.numberOfParts$.pipe(delay(0));
  }

  public setNumberOfParts(): void {
    this.dashboardState.setNumberOfParts({ loader: true });
    this.dashboardService.getStats().subscribe(
      (kpiStats: Dashboard) => {
        const mspid = realm[1].toLocaleUpperCase();
        const assetsCount =
          kpiStats.qualityAlertCount[mspid] && kpiStats.qualityAlertCount[mspid].length
            ? +kpiStats.qualityAlertCount[mspid][0].totalAssetsCount
            : 0;

        this.dashboardState.setNumberOfParts({ data: assetsCount });
      },
      error => this.dashboardState.setNumberOfParts({ error }),
    );
  }
}