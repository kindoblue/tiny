import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { FloorPlanService } from '../../services/floor-plan.service';
import { Building, Floor, Room, Seat } from '../../models/floor-plan.interface';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-floor-plan',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './floor-plan.component.html',
  styleUrls: ['./floor-plan.component.scss']
})
export class FloorPlanComponent implements OnInit {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef;

  building: Building | null = null;
  selectedFloorId: string = '';
  currentTool: 'select' | 'room' | 'seat' = 'select';
  showJsonOutput = false;
  jsonOutput = '';
  
  private svg: any;
  private g: any;
  private zoom: any;
  private selectedRoom: Room | null = null;

  constructor(
    private floorPlanService: FloorPlanService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('Initializing floor plan component');
    this.initializeSvg();
    this.loadData();
  }

  private initializeSvg() {
    console.log('Initializing SVG');
    const container = this.svgContainer.nativeElement;
    
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('border', '1px solid red'); // Adding a border to see the SVG bounds

    this.g = this.svg.append('g');

    this.zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);
    
    // Initial zoom transform
    const initialTransform = d3.zoomIdentity.translate(100, 100).scale(0.8);
    this.svg.call(this.zoom.transform, initialTransform);
  }

  private loadData() {
    console.log('Loading floor plan data');
    this.floorPlanService.loadFloorPlanData().subscribe(building => {
      console.log('Loaded building data:', building);
      this.building = building;
      if (building.floors.length > 0) {
        this.selectedFloorId = building.floors[0].id;
        console.log('Selected floor:', this.selectedFloorId);
        this.renderFloorPlan();
      }
    });
  }

  onFloorChange() {
    this.renderFloorPlan();
    this.selectedRoom = null;
  }

  setTool(tool: 'select' | 'room' | 'seat') {
    this.currentTool = tool;
    this.setupInteractions();
  }

  private renderFloorPlan() {
    console.log('Rendering floor plan');
    if (!this.building) {
      console.warn('No building data available');
      return;
    }

    const floor = this.building.floors.find(f => f.id === this.selectedFloorId);
    if (!floor) {
      console.warn('No floor found with ID:', this.selectedFloorId);
      return;
    }

    console.log('Rendering floor:', floor);
    console.log('Number of rooms:', floor.rooms.length);

    // Clear previous content
    this.g.selectAll('*').remove();

    // Draw rooms directly without TopoJSON
    const roomsG = this.g.selectAll('.room')
      .data(floor.rooms)
      .enter()
      .append('g')
      .attr('class', (d: Room) => `room${d.id === this.selectedRoom?.id ? ' selected' : ''}`)
      .attr('id', (d: Room) => `room-${d.id}`)
      .attr('transform', (d: Room) => `translate(${d.x},${d.y})`);

    // Room rectangles
    roomsG.append('rect')
      .attr('class', 'room-bg')
      .attr('width', (d: Room) => d.width)
      .attr('height', (d: Room) => d.height)
      .style('fill', 'white')
      .style('stroke', (d: Room) => d.id === this.selectedRoom?.id ? '#1976D2' : '#2196F3')
      .style('stroke-width', (d: Room) => d.id === this.selectedRoom?.id ? 3 : 2)
      .on('click', (event: any, d: Room) => this.onRoomClick(d));

    // Room titles
    roomsG.append('text')
      .attr('x', 10)
      .attr('y', 25)
      .text((d: Room) => d.name)
      .style('fill', '#333')
      .style('font-size', '14px')
      .style('font-weight', '500');

    // Add resize handles for selected room
    roomsG.each((d: Room) => {
      if (d.id === this.selectedRoom?.id) {
        const room = d3.select(`#room-${d.id}`);
        
        // Corner handles
        const corners = [
          { class: 'nw', x: 0, y: 0 },
          { class: 'ne', x: d.width, y: 0 },
          { class: 'se', x: d.width, y: d.height },
          { class: 'sw', x: 0, y: d.height }
        ];

        corners.forEach(corner => {
          room.append('circle')
            .attr('class', `resize-handle resize-handle-corner ${corner.class}`)
            .attr('cx', corner.x)
            .attr('cy', corner.y)
            .attr('r', 6)
            .call((d3.drag() as any)
              .on('drag', (event: any) => {
                const dx = event.dx;
                const dy = event.dy;
                
                switch (corner.class) {
                  case 'nw':
                    d.x += dx;
                    d.y += dy;
                    d.width -= dx;
                    d.height -= dy;
                    break;
                  case 'ne':
                    d.y += dy;
                    d.width += dx;
                    d.height -= dy;
                    break;
                  case 'se':
                    d.width += dx;
                    d.height += dy;
                    break;
                  case 'sw':
                    d.x += dx;
                    d.width -= dx;
                    d.height += dy;
                    break;
                }

                // Ensure minimum size
                if (d.width < 100) d.width = 100;
                if (d.height < 100) d.height = 100;

                // Update room visuals
                this.updateRoomVisuals(d);
              })
              .on('end', (event: any) => {
                this.floorPlanService.updateRoom(this.selectedFloorId, d);
              }));
        });

        // Edge handles
        const edges = [
          { class: 'n', x: d.width / 2, y: 0 },
          { class: 'e', x: d.width, y: d.height / 2 },
          { class: 's', x: d.width / 2, y: d.height },
          { class: 'w', x: 0, y: d.height / 2 }
        ];

        edges.forEach(edge => {
          room.append('circle')
            .attr('class', `resize-handle resize-handle-edge ${edge.class}`)
            .attr('cx', edge.x)
            .attr('cy', edge.y)
            .attr('r', 6)
            .call((d3.drag() as any)
              .on('drag', (event: any) => {
                const dx = event.dx;
                const dy = event.dy;
                
                switch (edge.class) {
                  case 'n':
                    d.y += dy;
                    d.height -= dy;
                    break;
                  case 'e':
                    d.width += dx;
                    break;
                  case 's':
                    d.height += dy;
                    break;
                  case 'w':
                    d.x += dx;
                    d.width -= dx;
                    break;
                }

                // Ensure minimum size
                if (d.width < 100) d.width = 100;
                if (d.height < 100) d.height = 100;

                // Update room visuals
                this.updateRoomVisuals(d);
              })
              .on('end', (event: any) => {
                this.floorPlanService.updateRoom(this.selectedFloorId, d);
              }));
        });
      }
    });

    // Draw seats
    floor.rooms.forEach(room => {
      const seatsG = this.g.selectAll(`.seats-${room.id}`)
        .data(room.seats)
        .enter()
        .append('g')
        .attr('class', `seat seats-${room.id}`)
        .attr('data-seat-id', (d: Seat) => d.id)
        .attr('transform', (d: Seat) => `translate(${room.x + d.x},${room.y + d.y})`);

      // Seat rectangles
      seatsG.append('rect')
        .attr('x', -20)
        .attr('y', -15)
        .attr('width', 40)
        .attr('height', 30)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('fill', (d: Seat) => this.getSeatColor(d))
        .style('stroke', '#666')
        .style('stroke-width', 1)
        .on('click', (event: any, d: Seat) => {
          if (event.shiftKey || event.ctrlKey || event.metaKey) {
            event.stopPropagation();
            this.onSeatClick(d, room);
          }
        });

      // Add dragging behavior to seats
      seatsG.call((d3.drag() as any)
        .on('start', (event: any, d: Seat) => {
          if (this.currentTool !== 'select') return;
          d3.select(event.sourceEvent.target.closest('g')).classed('dragging', true);
        })
        .on('drag', (event: any, d: Seat) => {
          if (this.currentTool !== 'select') return;
          
          // Update seat position relative to its room
          d.x += event.dx;
          d.y += event.dy;
          
          // Update visual position of the seat
          const seatElement = this.g.select(`.seats-${room.id}[data-seat-id="${d.id}"]`);
          seatElement.attr('transform', `translate(${room.x + d.x},${room.y + d.y})`);
        })
        .on('end', (event: any, d: Seat) => {
          if (this.currentTool !== 'select') return;
          const g = d3.select(event.sourceEvent.target.closest('g'));
          g.classed('dragging', false);
          
          // Ensure seat stays within room bounds
          const PADDING = 20;
          d.x = Math.max(PADDING, Math.min(room.width - PADDING, d.x));
          d.y = Math.max(PADDING, Math.min(room.height - PADDING, d.y));
          
          this.floorPlanService.updateSeat(this.selectedFloorId, room.id, d);
        }));

      // Seat labels
      seatsG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 5)
        .style('fill', '#fff')
        .style('font-size', '10px')
        .text((d: Seat) => d.label);
    });

    // Add dragging behavior
    roomsG.call((d3.drag() as any)
      .on('start', (event: any, d: Room) => {
        if (this.currentTool !== 'select') return;
        d3.select(event.sourceEvent.target.closest('g')).classed('dragging', true);
      })
      .on('drag', (event: any, d: Room) => {
        if (this.currentTool !== 'select') return;
        
        // Update room position
        d.x += event.dx;
        d.y += event.dy;
        
        // Update visual position of the room
        const roomElement = d3.select(`#room-${d.id}`);
        roomElement.attr('transform', `translate(${d.x},${d.y})`);
        
        // Update seats - they should move with their parent room
        d.seats.forEach(seat => {
          const seatElement = this.g.select(`.seats-${d.id}[data-seat-id="${seat.id}"]`);
          seatElement.attr('transform', `translate(${d.x + seat.x},${d.y + seat.y})`);
        });
      })
      .on('end', (event: any, d: Room) => {
        if (this.currentTool !== 'select') return;
        const g = d3.select(event.sourceEvent.target.closest('g'));
        g.classed('dragging', false);
        
        this.floorPlanService.updateRoom(this.selectedFloorId, d);
        this.onRoomClick(d);
      }));

    // Setup other interactions
    this.setupInteractions();
  }

  private getSeatColor(seat: Seat): string {
    switch (seat.status) {
      case 'occupied': return '#ef5350';
      case 'reserved': return '#ffa726';
      default: return '#66bb6a';
    }
  }

  private onRoomClick(room: Room) {
    if (this.currentTool === 'select') {
      this.selectedRoom = room;
      // Re-render to show resize handles
      this.renderFloorPlan();
    }
  }

  private calculateGridLayout(room: Room): { x: number; y: number; }[] {
    const DESK_WIDTH = 40;
    const DESK_HEIGHT = 30;
    const PADDING = 20;
    const SPACING = 10;

    // Calculate available space
    const availableWidth = room.width - (2 * PADDING);
    const availableHeight = room.height - (2 * PADDING);

    // Calculate grid dimensions
    const cols = Math.floor(availableWidth / (DESK_WIDTH + SPACING));
    const rows = Math.floor(availableHeight / (DESK_HEIGHT + SPACING));

    // Generate grid positions
    const positions: { x: number; y: number; }[] = [];
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        positions.push({
          x: PADDING + j * (DESK_WIDTH + SPACING) + DESK_WIDTH/2,
          y: PADDING + i * (DESK_HEIGHT + SPACING) + DESK_HEIGHT/2
        });
      }
    }

    return positions;
  }

  private onSeatClick(seat: Seat, room: Room) {
    if (this.currentTool === 'select') {
      // Cycle through seat statuses
      const statuses: ('available' | 'occupied' | 'reserved')[] = ['available', 'occupied', 'reserved'];
      const currentIndex = statuses.indexOf(seat.status || 'available');
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      
      const updatedSeat: Seat = { ...seat, status: nextStatus };
      this.floorPlanService.updateSeat(this.selectedFloorId, room.id, updatedSeat);
      this.renderFloorPlan();
    }
  }

  private setupInteractions() {
    // Remove previous event listeners
    this.svg.on('mousedown', null)
      .on('mousemove', null)
      .on('mouseup', null)
      .on('click', null);

    if (this.currentTool === 'room') {
      let startX: number, startY: number;
      
      this.svg.on('mousedown', (event: any) => {
        const [x, y] = d3.pointer(event, this.g.node());
        startX = x;
        startY = y;
        
        this.g.append('rect')
          .attr('class', 'new-room')
          .attr('x', x)
          .attr('y', y)
          .attr('width', 0)
          .attr('height', 0)
          .attr('fill', 'white')
          .attr('stroke', '#2196F3')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('rx', 8)
          .attr('ry', 8);
      });

      this.svg.on('mousemove', (event: any) => {
        if (!startX || !startY) return;
        
        const [currentX, currentY] = d3.pointer(event, this.g.node());
        const width = currentX - startX;
        const height = currentY - startY;

        this.g.select('.new-room')
          .attr('width', Math.abs(width))
          .attr('height', Math.abs(height))
          .attr('x', width < 0 ? currentX : startX)
          .attr('y', height < 0 ? currentY : startY);
      });

      this.svg.on('mouseup', (event: any) => {
        const [currentX, currentY] = d3.pointer(event, this.g.node());
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        if (width > 100 && height > 100) {  // Minimum room size
          const room: Room = {
            id: `room-${Date.now()}`,
            name: `Room ${this.building?.floors.find(f => f.id === this.selectedFloorId)?.rooms.length ?? 0 + 1}`,
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width,
            height,
            seats: []
          };

          this.floorPlanService.updateRoom(this.selectedFloorId, room);
          this.renderFloorPlan();
        }
        
        startX = startY = 0;
        this.g.select('.new-room').remove();
      });
    } else if (this.currentTool === 'seat') {
      this.svg.on('click', (event: any) => {
        if (!this.selectedRoom) {
          alert('Please select a room first');
          return;
        }

        const [x, y] = d3.pointer(event, this.g.node());
        const roomG = this.g.select(`#room-${this.selectedRoom.id}`);
        const transform = roomG.attr('transform');
        const currentTranslate = transform ? transform.match(/translate\(([^)]+)\)/) : null;
        const [roomX, roomY] = currentTranslate ? currentTranslate[1].split(',').map(Number) : [this.selectedRoom.x, this.selectedRoom.y];
        
        // Convert global coordinates to room-relative coordinates
        const relativeX = x - roomX;
        const relativeY = y - roomY;
        
        // Check if click is inside the selected room
        if (relativeX >= 0 && 
            relativeX <= this.selectedRoom.width &&
            relativeY >= 0 && 
            relativeY <= this.selectedRoom.height) {
          
          const positions = this.calculateGridLayout(this.selectedRoom);
          const nextIndex = this.selectedRoom.seats.length;
          
          // Check if we've exceeded grid capacity
          if (nextIndex >= positions.length) {
            alert('No more space for desks in this room');
            return;
          }

          const position = positions[nextIndex];
          
          const seat: Seat = {
            id: `seat-${Date.now()}`,
            label: `D${nextIndex + 1}`,
            x: position.x,
            y: position.y,
            status: 'available'
          };

          this.floorPlanService.updateSeat(this.selectedFloorId, this.selectedRoom.id, seat);
          this.renderFloorPlan();
        }
      });
    }
  }

  private updateRoomVisuals(room: Room) {
    const roomElement = d3.select(`#room-${room.id}`);
    
    // Update room position and size
    roomElement.attr('transform', `translate(${room.x},${room.y})`);
    roomElement.select('rect')
      .attr('width', room.width)
      .attr('height', room.height);

    // Update resize handles
    const corners = [
      { class: 'nw', x: 0, y: 0 },
      { class: 'ne', x: room.width, y: 0 },
      { class: 'se', x: room.width, y: room.height },
      { class: 'sw', x: 0, y: room.height }
    ];

    corners.forEach(corner => {
      roomElement.select(`.resize-handle-corner.${corner.class}`)
        .attr('cx', corner.x)
        .attr('cy', corner.y);
    });

    const edges = [
      { class: 'n', x: room.width / 2, y: 0 },
      { class: 'e', x: room.width, y: room.height / 2 },
      { class: 's', x: room.width / 2, y: room.height },
      { class: 'w', x: 0, y: room.height / 2 }
    ];

    edges.forEach(edge => {
      roomElement.select(`.resize-handle-edge.${edge.class}`)
        .attr('cx', edge.x)
        .attr('cy', edge.y);
    });

    // Update seats
    room.seats.forEach(seat => {
      const seatElement = this.g.select(`.seats-${room.id}[data-seat-id="${seat.id}"]`);
      seatElement.attr('transform', `translate(${room.x + seat.x},${room.y + seat.y})`);
    });
  }

  saveFloorPlan() {
    if (!this.building) return;
    
    // Create a formatted JSON string
    this.jsonOutput = JSON.stringify(this.building, null, 2);
    this.showJsonOutput = true;
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.jsonOutput).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    });
  }
}
