import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkRendererComponent } from './link-renderer.component';

describe('LinkRendererComponent', () => {
  let component: LinkRendererComponent;
  let fixture: ComponentFixture<LinkRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
