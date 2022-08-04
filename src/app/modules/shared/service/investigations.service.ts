/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { environment } from '@env';
import { Part } from '@page/parts/model/parts.model';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InvestigationsAssembler } from '../assembler/investigations.assembler';

import {
  Investigation,
  InvestigationResponse,
  Investigations,
  InvestigationsResponse,
  InvestigationStatusGroup,
} from '../model/investigations.model';

@Injectable({
  providedIn: 'root',
})
export class InvestigationsService {
  private url = environment.apiUrl;

  constructor(private apiService: ApiService) {}

  public getInvestigationsByType(
    type: InvestigationStatusGroup,
    page: number,
    pageSize: number,
  ): Observable<Investigations> {
    const params = new HttpParams().set('page', page).set('size', pageSize);

    return this.apiService
      .getBy<InvestigationsResponse>(`${this.url}/investigations/${type}`, params)
      .pipe(map(investigations => InvestigationsAssembler.assembleInvestigations(investigations)));
  }

  public postInvestigation(selectedParts: Part[], description: string): Observable<Investigation> {
    const body = { selectedParts, description };

    return this.apiService
      .post<InvestigationResponse>(`${this.url}/investigations`, body)
      .pipe(map(investigation => InvestigationsAssembler.assembleInvestigation(investigation)));
  }
}