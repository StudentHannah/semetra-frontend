import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseProgress } from '../../models/course-progress.model';
import { ProgressService } from '../../services/progress';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private progressService = inject(ProgressService);

  progressData: CourseProgress[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    console.log('Dashboard ngOnInit');
    this.loadProgress();
  }

  loadProgress(): void {
    this.loading = true;
    this.error = '';

    this.progressService.getProgress().subscribe({
      next: (data) => {
        console.log('DATA ARRIVED', data);
        this.progressData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('LOAD ERROR', err);
        this.error = 'Daten konnten nicht geladen werden.';
        this.loading = false;
      },
    });
  }
}
