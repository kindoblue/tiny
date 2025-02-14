import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Building, Floor, Room, Seat } from '../models/floor-plan.interface';

@Injectable({
  providedIn: 'root'
})
export class FloorPlanService {
  private currentBuildingSubject = new BehaviorSubject<Building | null>(null);
  public currentBuilding$ = this.currentBuildingSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadFloorPlanData(): Observable<Building> {
    return this.http.get<Building>('assets/floor-plan-data.json').pipe(
      tap(building => this.setCurrentBuilding(building))
    );
  }

  setCurrentBuilding(building: Building) {
    this.currentBuildingSubject.next(building);
  }

  updateRoom(floorId: string, room: Room) {
    const building = this.currentBuildingSubject.value;
    if (!building) return;

    const floor = building.floors.find(f => f.id === floorId);
    if (!floor) return;

    const roomIndex = floor.rooms.findIndex(r => r.id === room.id);
    if (roomIndex === -1) {
      floor.rooms.push(room);
    } else {
      floor.rooms[roomIndex] = room;
    }

    this.currentBuildingSubject.next({...building});
  }

  updateSeat(floorId: string, roomId: string, seat: Seat) {
    const building = this.currentBuildingSubject.value;
    if (!building) return;

    const floor = building.floors.find(f => f.id === floorId);
    if (!floor) return;

    const room = floor.rooms.find(r => r.id === roomId);
    if (!room) return;

    const seatIndex = room.seats.findIndex(s => s.id === seat.id);
    if (seatIndex === -1) {
      room.seats.push(seat);
    } else {
      room.seats[seatIndex] = seat;
    }

    this.currentBuildingSubject.next({...building});
  }
} 