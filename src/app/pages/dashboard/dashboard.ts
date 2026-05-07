import { CommonModule } from '@angular/common';
import { CourseProgress } from '../../models/course-progress.model';
import { ProgressService } from '../../services/progress';
import { Router } from '@angular/router';
import confetti from 'canvas-confetti';
import {
  Component,
  OnInit,
  AfterViewInit,
  QueryList,
  ViewChildren,
  ElementRef,
  inject,
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NgZone } from '@angular/core';
import { jelly } from 'ldrs';


type AnimatedCourseProgress = CourseProgress & {
  animatedProgressPercent: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private progressService = inject(ProgressService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  animatedTotalCourses = 0;
  animatedTotalEh = 0;
  animatedCompletedEh = 0;
  animatedAverageProgress = 0;
  private summaryAnimationStarted = false;

  progressData: AnimatedCourseProgress[] = [];

  @ViewChildren('courseCard') courseCards!: QueryList<ElementRef>;

  private confettiTriggeredCourses = new Set<string>();

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
    jelly.register();
  }

  ngAfterViewInit(): void {
    this.courseCards.changes.subscribe(() => {
      this.observeCourseCards();
    });
  }

  private animateSummaryNumbers(): void {
    if (this.summaryAnimationStarted) {
      return;
    }

    this.summaryAnimationStarted = true;

    const duration = 2000;
    const startTime = performance.now();

    const targetTotalCourses = this.totalCourses;
    const targetTotalEh = this.totalEh;
    const targetCompletedEh = this.completedEh;
    const targetAverageProgress = this.averageProgress;

    // Eine durchgehende Kurve:
    // startet schnell, wird dann immer langsamer, ohne harten Übergang
    const smoothFastStartSlowEnd = (t: number): number => {
      return 1 - Math.pow(1 - t, 7);
    };

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = smoothFastStartSlowEnd(progress);

      this.animatedTotalCourses = Math.round(targetTotalCourses * easedProgress);
      this.animatedTotalEh = Math.round(targetTotalEh * easedProgress);
      this.animatedCompletedEh = Math.round(targetCompletedEh * easedProgress);
      this.animatedAverageProgress = targetAverageProgress * easedProgress;

      if (progress < 1) {
        this.cdr.detectChanges();
        requestAnimationFrame(animate);
        return;
      }

      this.animatedTotalCourses = targetTotalCourses;
      this.animatedTotalEh = targetTotalEh;
      this.animatedCompletedEh = targetCompletedEh;
      this.animatedAverageProgress = targetAverageProgress;

      this.cdr.detectChanges();
    };

    requestAnimationFrame(animate);
  }
  loadProgress(): void {
    this.loading = true;
    this.error = '';

    this.summaryAnimationStarted = false;
    this.animatedTotalCourses = 0;
    this.animatedTotalEh = 0;
    this.animatedCompletedEh = 0;
    this.animatedAverageProgress = 0;

    const fakeLoadingDelay = 4000;

    this.progressService.getProgress().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.progressData = data.map((course) => ({
            ...course,
            animatedProgressPercent: 0,
          }));

          this.loading = false;

          this.cdr.detectChanges();

          setTimeout(() => {
            this.animateSummaryNumbers();
            this.observeCourseCards();
          }, 0);
        }, fakeLoadingDelay);
      },
      error: () => {
        setTimeout(() => {
          this.error = 'Daten konnten nicht geladen werden.';
          this.loading = false;
          this.cdr.detectChanges();
        }, fakeLoadingDelay);
      },
    });
  }

  openCourse(courseShort: string): void {
    this.router.navigate(['/course', courseShort]);
  }

  private observeCourseCards(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const cardElement = entry.target as HTMLElement;
          const courseShort = cardElement.dataset['course'];

          if (!courseShort) {
            return;
          }

          const course = this.progressData.find((c) => c.courseShort === courseShort);

          if (!course) {
            return;
          }

          course.animatedProgressPercent = course.progressPercent;
          this.cdr.detectChanges();

          if (course.progressPercent >= 100 && !this.confettiTriggeredCourses.has(courseShort)) {
            this.confettiTriggeredCourses.add(courseShort);

            setTimeout(() => {
              this.launchConfettiAtCard(cardElement);
            }, 1450);
          }

          observer.unobserve(cardElement);
        });
      },
      {
        threshold: 0.45,
      },
    );

    this.courseCards.forEach((card) => {
      observer.observe(card.nativeElement);
    });
  }

  private observeCompletedCards(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardElement = entry.target as HTMLElement;
          const courseShort = cardElement.dataset['course'];

          if (
            entry.isIntersecting &&
            cardElement.classList.contains('completed-card') &&
            courseShort &&
            !this.confettiTriggeredCourses.has(courseShort)
          ) {
            this.confettiTriggeredCourses.add(courseShort);
            this.launchConfettiAtCard(cardElement);
            observer.unobserve(cardElement);
          }
        });
      },
      {
        threshold: 0.65,
      },
    );

    this.courseCards.forEach((card) => {
      observer.observe(card.nativeElement);
    });
  }

  private launchConfettiAtCard(cardElement: HTMLElement): void {
    const rect = cardElement.getBoundingClientRect();

    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 120,
      spread: 75,
      startVelocity: 42,
      scalar: 0.95,
      origin: { x, y },
    });

    setTimeout(() => {
      confetti({
        particleCount: 70,
        spread: 60,
        startVelocity: 32,
        scalar: 0.8,
        origin: {
          x: Math.max(0.1, x - 0.12),
          y,
        },
      });

      confetti({
        particleCount: 70,
        spread: 60,
        startVelocity: 32,
        scalar: 0.8,
        origin: {
          x: Math.min(0.9, x + 0.12),
          y,
        },
      });
    }, 180);
  }
}
