import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BolDemonsService {

  constructor(private http: HttpClient) {
  }

  demons(): Observable<any[]> {
    return this.http.get<any[]>('/api/bol/demon');
  }

  categories(): Observable<any[]> {
    return this.http.get<any[]>('/api/bol/demon/categories');
  }

  pouvoirs(): Observable<any[]> {
    return this.http.get<any[]>('/api/bol/demon/pouvoirs');
  }

  createDemon(demon: any): Observable<any> {
    return this.http.post<any>('/api/bol/demon/create', <any>demon);
  }

  updateDemon(demon: any): Observable<any> {
    return this.http.post<any>('/api/bol/demon/update', <any>demon);
  }

  deleteDelete(id: string): Observable<any> {
    return this.http.delete<any>('/api/bol/demon/delete/' + id);
  }
}
