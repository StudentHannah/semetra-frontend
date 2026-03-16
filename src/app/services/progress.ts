import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseProgress } from '../models/course-progress.model';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private http = inject(HttpClient);
  private apiUrl = '/api/progress';

  getProgress(): Observable<CourseProgress[]> {
    return this.http.get<CourseProgress[]>(this.apiUrl);
  }
}
