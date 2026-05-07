import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseEvent } from '../../models/course-event.model';
import { ProgressService } from '../../services/progress';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.scss',
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private cdr = inject(ChangeDetectorRef);


  courseShort = '';
  courseName = '';
  events: CourseEvent[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.courseShort = this.route.snapshot.paramMap.get('courseShort') ?? '';

    if (!this.courseShort) {
      this.error = 'Kein Fach angegeben.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.progressService.getCourseEvents(this.courseShort).subscribe({
      next: (data) => {
        this.events = data;
        this.courseName = data[0]?.courseName ?? this.courseShort;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Fachtermine konnten nicht geladen werden.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get totalEh(): number {
    return this.events.reduce((sum, event) => sum + event.eh, 0);
  }

  get completedEh(): number {
    return this.events
      .filter((event) => event.isCompleted)
      .reduce((sum, event) => sum + event.eh, 0);
  }

  get remainingEh(): number {
    return this.totalEh - this.completedEh;
  }

  toggleMissed(event: CourseEvent): void {
    console.log(event);
    const newStatus = event.attendanceStatus === 'missed' ? 'attended' : 'missed';

    this.progressService.updateAttendance(event.id, newStatus).subscribe({
      next: () => {
        event.attendanceStatus = newStatus;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
