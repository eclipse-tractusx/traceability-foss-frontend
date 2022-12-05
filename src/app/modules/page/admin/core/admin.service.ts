/********************************************************************************
 * Copyright (c) 2022, 2023 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)
 * Copyright (c) 2022, 2023 ZF Friedrichshafen AG
 * Copyright (c) 2022, 2023 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/


import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { Pagination } from '@core/model/pagination.model';
import { environment } from '@env';
import { AdminAssembler } from '@page/admin/core/admin.assembler';
import { RegistryProcess, RegistryProcessResponse } from '@page/admin/core/admin.model';
import { TableHeaderSort } from '@shared/components/table/table.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AdminService {
  private readonly url = environment.apiUrl;
  constructor(private readonly apiService: ApiService) {}

  public getScheduledRegistryProcesses(
    page: number,
    pageSize: number,
    sorting: TableHeaderSort,
  ): Observable<Pagination<RegistryProcess>> {
    const sort = sorting ? `${sorting[0]},${sorting[1]}` : '';
    const params = new HttpParams().set('page', page).set('size', pageSize).set('sort', sort);

    return this.apiService
      .getBy<Pagination<RegistryProcessResponse>>(`${this.url}/metrics/registry-lookup`, params)
      .pipe(map(data => AdminAssembler.assemblePaginationRegistryProcess(data)));
  }
}
