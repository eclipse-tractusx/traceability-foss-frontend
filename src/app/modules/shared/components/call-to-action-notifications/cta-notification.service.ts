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

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { I18nMessage } from '@shared/model/i18n-message';

import { CallAction, CtaNotificationData } from './cta-notification.model';
import { CtaNotificationComponent } from './cta-notification.component';

// CTA stands for call-to-action
@Injectable({
  providedIn: 'root',
})
export class CtaNotificationService {
  constructor(private snackBar: MatSnackBar) {}

  public show(text: I18nMessage, actions: CallAction[]): void {
    const data: CtaNotificationData = { text, actions };
    this.snackBar.openFromComponent(CtaNotificationComponent, { data });
  }
}