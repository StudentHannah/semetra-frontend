import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseProgress } from '../../models/course-progress.model';
import { ProgressService } from '../../services/progress';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private progressService = inject(ProgressService);
  private router = inject(Router);
  progressData: CourseProgress[] = [];
  loading = true;
  error = '';

  get totalCourses(): number {
    return this.progressData.length;
  }

  get totalEh(): number {
    return this.progressData.reduce((sum, course) => sum + course.totalEh, 0);
  }

  get completedEh(): number {
    return this.progressData.reduce((sum, course) => sum + course.completedEh, 0);
  }

  get remainingEh(): number {
    return this.progressData.reduce((sum, course) => sum + course.remainingEh, 0);
  }

  get averageProgress(): number {
    if (this.progressData.length === 0) return 0;

    const total = this.progressData.reduce((sum, course) => sum + course.progressPercent, 0);

    return total / this.progressData.length;
  }

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress(): void {
    this.loading = true;
    this.error = '';

    this.progressService.getProgress().subscribe({
      next: (data) => {
        this.progressData = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Daten konnten nicht geladen werden.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openCourse(courseShort: string): void {
    this.router.navigate(['/course', courseShort]);
  }
}
