import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskMonitorComponent } from './task-monitor.component';

describe('TaskMonitorComponent', () => {
  let component: TaskMonitorComponent;
  let fixture: ComponentFixture<TaskMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskMonitorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
