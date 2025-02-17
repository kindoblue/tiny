import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { FloorPlanService } from '../../services/floor-plan.service';
import { Building, Floor, Room } from '../../models/floor-plan.interface';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

interface HandlePosition {
  position: 'se' | 'e' | 's';
  x: number;
  y: number;
}

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
    this.initializeDefaultRoom();
  }

  private initializeSvg() {
    console.log('Initializing SVG');
    const container = this.svgContainer.nativeElement;
    
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('border', '1px solid red');

    // Create a background group for the floor plan SVG
    const backgroundGroup = this.svg.append('g')
      .attr('class', 'background-layer');

    // Create the main group for interactive elements
    this.g = this.svg.append('g')
      .attr('class', 'interactive-layer');

    // Load the background SVG
    d3.xml('/assets/output.svg').then((data) => {
      const backgroundSvg = data.documentElement;
      // Extract the viewBox from the original SVG
      const viewBox = backgroundSvg.getAttribute('viewBox');
      
      // Set the viewBox on our main SVG to match the background
      if (viewBox) {
        this.svg.attr('viewBox', viewBox);
      }
      
      // Append the background SVG content
      backgroundGroup.node().appendChild(backgroundSvg);
    }).catch(error => {
      console.error('Error loading background SVG:', error);
    });

    this.zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        backgroundGroup.attr('transform', event.transform);
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);
    
    // Initial zoom transform
    const initialTransform = d3.zoomIdentity.translate(100, 100).scale(0.8);
    this.svg.call(this.zoom.transform, initialTransform);
  }

  private initializeDefaultRoom() {
    const defaultRoom: Room = {
      id: 'room-1',
      name: 'Default Room',
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      seats: [
        {
          id: 'seat-1',
          label: 'D1',
          x: 40,
          y: 40,
          width: 60,
          height: 40,
          rotation: 0
        },
        {
          id: 'seat-2',
          label: 'D2',
          x: 120,
          y: 40,
          width: 60,
          height: 40,
          rotation: 0
        },
        {
          id: 'seat-3',
          label: 'D3',
          x: 200,
          y: 40,
          width: 60,
          height: 40,
          rotation: 0
        }
      ]
    };

    this.selectedRoom = defaultRoom;
    this.renderRoom(defaultRoom);
  }

  private renderRoom(room: Room) {
    // Clear previous content
    this.g.selectAll('*').remove();

    // Add title text at the top of the canvas
    this.g.append('text')
      .attr('class', 'instruction-text')
      .attr('x', '50%')  // Center horizontally
      .attr('y', 40)     // Fixed position from top
      .attr('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '24px')
      .style('font-weight', '700')
      .text('Please drag the room in place so the geometry can be updated');

    const roomG = this.g.append('g')
      .attr('class', 'room')
      .attr('id', `room-${room.id}`)
      .attr('transform', `translate(${room.x},${room.y})`);

    // Room rectangle
    roomG.append('rect')
      .attr('class', 'room-bg')
      .attr('width', room.width)
      .attr('height', room.height)
      .style('fill', 'white')
      .style('stroke', '#2196F3')
      .style('stroke-width', 2);

    // Room title
    roomG.append('text')
      .attr('x', 10)
      .attr('y', 25)
      .text(room.name)
      .style('fill', '#333')
      .style('font-size', '14px')
      .style('font-weight', '500');

    // Render seats
    room.seats.forEach(seat => {
      const seatG = roomG.append('g')
        .attr('class', 'seat')
        .attr('id', `seat-${seat.id}`)
        .attr('transform', `translate(${seat.x},${seat.y})`);

      // Create a group for rotation
      const rotationG = seatG.append('g')
        .attr('class', 'rotation-group')
        .attr('transform', `rotate(${seat.rotation}) translate(${-seat.width/2},${-seat.height/2})`);

      // Seat rectangle and label in the rotation group
      rotationG.append('rect')
        .attr('width', seat.width)
        .attr('height', seat.height)
        .style('fill', '#f5f5f5')
        .style('stroke', '#666')
        .style('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', (event: any) => {
          // Calculate next rotation
          const nextRotation = (seat.rotation + 45) % 360;
          
          // Animate rotation
          rotationG.transition()
            .duration(300)  // Animation duration in milliseconds
            .ease(d3.easeQuadInOut)  // Smooth easing function
            .attrTween('transform', () => {
              const interpolate = d3.interpolate(seat.rotation, nextRotation);
              return (t: number) => `rotate(${interpolate(t)}) translate(${-seat.width/2},${-seat.height/2})`;
            })
            .on('end', () => {
              // Update the seat's rotation value after animation
              seat.rotation = nextRotation;
            });
        });

      // Add label inside the rotation group
      rotationG.append('text')
        .attr('class', 'seat-label')
        .attr('x', seat.width / 2)
        .attr('y', seat.height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(seat.label)
        .style('fill', '#333')
        .style('font-size', '12px')
        .style('pointer-events', 'none');

      // Add dragging behavior to seats
      seatG.call((d3.drag() as any)
        .on('start', (event: any) => {
          d3.select(event.sourceEvent.target.closest('g.seat')).classed('dragging', true);
        })
        .on('drag', (event: any) => {
          // Update seat position (relative to room)
          seat.x += event.dx;
          seat.y += event.dy;

          // Get effective dimensions based on rotation
          const rotationRad = (seat.rotation * Math.PI) / 180;
          const cosRotation = Math.abs(Math.cos(rotationRad));
          const sinRotation = Math.abs(Math.sin(rotationRad));
          
          // Calculate effective dimensions considering 45-degree rotations
          const effectiveWidth = seat.width * cosRotation + seat.height * sinRotation;
          const effectiveHeight = seat.height * cosRotation + seat.width * sinRotation;

          // Constrain seat within room bounds
          seat.x = Math.max(effectiveWidth/2, Math.min(room.width - effectiveWidth/2, seat.x));
          seat.y = Math.max(effectiveHeight/2, Math.min(room.height - effectiveHeight/2, seat.y));

          // Update visual position
          seatG.attr('transform', `translate(${seat.x},${seat.y})`);
        })
        .on('end', (event: any) => {
          d3.select(event.sourceEvent.target.closest('g.seat')).classed('dragging', false);
        }));
    });

    // Add resize handles
    this.createResizeHandles(room);

    // Add dragging behavior for room
    roomG.call((d3.drag() as any)
      .on('start', (event: any) => {
        d3.select(event.sourceEvent.target.closest('g')).classed('dragging', true);
      })
      .on('drag', (event: any) => {
        room.x += event.dx;
        room.y += event.dy;
        roomG.attr('transform', `translate(${room.x},${room.y})`);
      })
      .on('end', (event: any) => {
        const g = d3.select(event.sourceEvent.target.closest('g'));
        g.classed('dragging', false);
      }));
  }

  private createResizeHandles(room: Room): void {
    const handleRadius = 8;
    const roomElement = d3.select(`#room-${room.id}`);
    
    // Remove existing handles first
    roomElement.selectAll('.resize-handle').remove();
    
    // Create handles within the room group
    const handles = roomElement
      .selectAll('.resize-handle')
      .data(this.getHandlePositions(room))
      .join('circle')
      .attr('class', 'resize-handle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', handleRadius)
      .style('cursor', (d: HandlePosition) => this.getResizeCursor(d.position));

    handles.call((d3.drag() as any)
      .on('drag', (event: any) => {
        const dx = event.dx;
        const dy = event.dy;
        const d = event.subject as HandlePosition;
        
        switch (d.position) {
          case 'se':
            room.width = Math.max(100, room.width + dx);
            room.height = Math.max(100, room.height + dy);
            break;
          case 'e':
            room.width = Math.max(100, room.width + dx);
            break;
          case 's':
            room.height = Math.max(100, room.height + dy);
            break;
        }

        // Update room visuals
        this.updateRoomVisuals(room);
      }));
  }

  private getHandlePositions(room: Room): HandlePosition[] {
    return [
      { position: 'se', x: room.width, y: room.height },
      { position: 'e', x: room.width, y: room.height / 2 },
      { position: 's', x: room.width / 2, y: room.height }
    ];
  }

  private getResizeCursor(position: HandlePosition['position']): string {
    const cursors: Record<HandlePosition['position'], string> = {
      se: 'se-resize',
      e: 'e-resize',
      s: 's-resize'
    };
    return cursors[position];
  }

  private updateRoomVisuals(room: Room) {
    const roomElement = d3.select(`#room-${room.id}`);
    
    // Update room position and size in a single operation
    roomElement
      .attr('transform', `translate(${room.x},${room.y})`)
      .select('rect')
      .attr('width', room.width)
      .attr('height', room.height);

    // Update resize handles positions in a single operation
    roomElement.selectAll('.resize-handle')
      .data(this.getHandlePositions(room))
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    // Update seat positions to ensure they stay within bounds
    room.seats.forEach(seat => {
      // Get effective dimensions based on rotation
      const rotationRad = (seat.rotation * Math.PI) / 180;
      const cosRotation = Math.abs(Math.cos(rotationRad));
      const sinRotation = Math.abs(Math.sin(rotationRad));
      
      // Calculate effective dimensions considering 45-degree rotations
      const effectiveWidth = seat.width * cosRotation + seat.height * sinRotation;
      const effectiveHeight = seat.height * cosRotation + seat.width * sinRotation;

      // Constrain seat within new room bounds
      seat.x = Math.max(effectiveWidth/2, Math.min(room.width - effectiveWidth/2, seat.x));
      seat.y = Math.max(effectiveHeight/2, Math.min(room.height - effectiveHeight/2, seat.y));

      // Update seat visual position in a single operation
      roomElement.select(`#seat-${seat.id}`)
        .attr('transform', `translate(${seat.x},${seat.y})`);
    });
  }

  saveFloorPlan() {
    if (!this.selectedRoom) return;
    
    // Create a formatted JSON string
    this.jsonOutput = JSON.stringify(this.selectedRoom, null, 2);
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
