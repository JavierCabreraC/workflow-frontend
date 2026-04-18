import { Routes } from '@angular/router';
import { TramiteSearchComponent } from './tramite-search/tramite-search.component';
import { TramiteTimelineComponent } from './tramite-timeline/tramite-timeline.component';

export const tramiteRoutes: Routes = [
  { path: '', component: TramiteSearchComponent },
  { path: ':id', component: TramiteTimelineComponent }
];
