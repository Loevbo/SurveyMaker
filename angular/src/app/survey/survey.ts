import { SessionStateService } from '@abp/ng.core';
import { Component } from '@angular/core';

@Component({
  selector: 'app-survey',
  imports: [],
  templateUrl: './survey.html',
  styleUrl: './survey.scss'
})
export class Survey {
  constructor(private session: SessionStateService) {

  }

  isTenantUser$ = this.session.getTenant().id
}
