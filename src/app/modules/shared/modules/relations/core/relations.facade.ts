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

import { Injectable } from '@angular/core';
import { Part } from '@page/parts/model/parts.model';
import { View } from '@shared/model/view.model';
import { RelationComponentState } from '@shared/modules/relations/core/component.state';
import { LoadedElementsFacade } from '@shared/modules/relations/core/loaded-elements.facade';
import { RelationsAssembler } from '@shared/modules/relations/core/relations.assembler';
import { OpenElements, TreeElement, TreeStructure } from '@shared/modules/relations/model/relations.model';
import { PartsService } from '@shared/service/parts.service';
import _deepClone from 'lodash-es/cloneDeep';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { bufferTime, catchError, debounceTime, filter, first, map, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class RelationsFacade {
  private readonly requestPartDetailsQueue = new Subject<string[]>();
  private readonly requestPartDetailsStream = new Subject<TreeElement[]>();
  private requestPartDetailsQueueSubscription: Subscription;

  constructor(
    private readonly partsService: PartsService,
    private readonly loadedElementsFacade: LoadedElementsFacade,
    private readonly relationComponentState: RelationComponentState,
  ) {
    this.requestPartDetailsQueueSubscription = this.initRequestPartDetailQueue().subscribe();
  }

  public get openElements$(): Observable<OpenElements> {
    return this.relationComponentState.openElements$.pipe(debounceTime(100));
  }

  public get openElements(): OpenElements {
    return this.relationComponentState.openElements;
  }

  // This is used to add an element with its children to the opened list
  public openElementWithChildren({ id, children }: TreeElement): void {
    const emptyChildren: OpenElements = {};
    const childElements =
      children?.reduce((p: OpenElements, c: string) => ({ ...p, [c]: null }), emptyChildren) || emptyChildren;

    this.relationComponentState.openElements = {
      ...this.relationComponentState.openElements,
      [id]: children,
      ...childElements,
    };

    this.loadChildrenInformation(children).subscribe();
  }

  // This is only to update already opened elements.
  public updateOpenElement({ id, children }: TreeElement): void {
    if (this.openElements[id] === undefined) {
      return;
    }

    this.relationComponentState.openElements = { ...this.relationComponentState.openElements, [id]: children };
    this.loadChildrenInformation(children).subscribe();
  }

  public deleteOpenElement(id: string): void {
    this.relationComponentState.openElements = this._deleteOpenElement(id, this.relationComponentState.openElements);
  }

  public formatOpenElementsToTreeData(openElements: OpenElements): TreeStructure {
    const loadedData = this.loadedElementsFacade.loadedElements;
    const keyList = Object.keys(openElements).reverse();
    const mappedData: Record<string, TreeStructure> = {};

    return keyList.reduce((p, key) => {
      const structure = RelationsAssembler.elementToTreeStructure(loadedData[key]);
      if (!structure) {
        return p;
      }

      structure.relations = structure.children?.length > 0 ? structure.children : null;
      structure.children = openElements[key]?.map(id => mappedData[id] || null).filter(child => !!child) || null;

      mappedData[key] = structure;
      return structure;
    }, {} as TreeStructure);
  }

  public isElementOpen(id: string): boolean {
    const currentElement = this.openElements[id];
    if (!currentElement) {
      return false;
    }

    // Checks if the children, of the current element, are open
    return currentElement.some(childId => Object.keys(this.openElements).includes(childId));
  }

  public resetRelationState(): void {
    this.relationComponentState.resetOpenElements();

    // Not resetting already loaded data keep the requests to a minimum.
    // this.relationsState.resetLoadedElements();
  }

  public openElementById(elementId: string): void {
    const elementToOpen = this.loadedElementsFacade.loadedElements[elementId];
    this.openElementWithChildren(elementToOpen);
  }

  public closeElementById(elementId: string): void {
    const elementToClose = this.loadedElementsFacade.loadedElements[elementId];
    elementToClose.children.forEach(childId => this.deleteOpenElement(childId));
  }

  public getRootPart(id: string): Observable<View<Part>> {
    return this.partsService.getPart(id).pipe(
      map((part: Part) => ({ data: part })),
      catchError((error: Error) => of({ error })),
    );
  }

  private _deleteOpenElement(id: string, openElements: OpenElements): OpenElements {
    let clonedElements = _deepClone(openElements);
    if (clonedElements[id]?.length) {
      clonedElements[id].forEach(childId => (clonedElements = this._deleteOpenElement(childId, clonedElements)));
    }

    delete clonedElements[id];
    return clonedElements;
  }

  private loadChildrenInformation(children: string[]): Observable<TreeElement[]> {
    if (!children) {
      return of(null).pipe(first());
    }

    const getLoadedElement = (id: string) => this.loadedElementsFacade.loadedElements[id];
    const isNoChildLoading = children.every(id => getLoadedElement(id) && getLoadedElement(id)?.state != 'loading');

    if (isNoChildLoading) {
      const mappedChildren = children.map(childId => this.loadedElementsFacade.loadedElements[childId]);
      this.addLoadedElements(mappedChildren);
      return of(mappedChildren).pipe(first());
    }

    this.requestPartDetailsQueue.next(children);
    return this.requestPartDetailsStream.asObservable();
  }

  private initRequestPartDetailQueue(): Observable<TreeElement[]> {
    let children;
    return this.requestPartDetailsQueue.pipe(
      bufferTime(500),
      filter(childList => !!childList.length),
      switchMap(childList => {
        children = childList;
        return this.partsService.getPartDetailOfIds(children.reduce((p, c) => [...p, ...c], []));
      }),
      catchError(_ => of(children.map(id => ({ id, children: [] } as Part)))),
      map(childrenData =>
        childrenData.map((child, index) => RelationsAssembler.assemblePartForRelation(child, children[index])),
      ),
      tap(childrenData => this.addLoadedElements(childrenData)),
      tap(childrenData => this.requestPartDetailsStream.next(childrenData)),
    );
  }

  private addLoadedElements(elements: TreeElement[]): void {
    elements.forEach(element => {
      this.loadedElementsFacade.addLoadedElement(element);
      this.updateOpenElement(element);
    });
  }
}
