export interface PunchRequest {
    employeeId: string,
    deviceId: string,
    latitude: number | undefined | null,
    longitude: number | undefined | null,
    accuracy?: number | undefined | null,
    ipAddress: string | null;
}

export interface PunchResponse {
    data: {
        timestamp: string,
        success: string,
        message: string,
        audioBytes: string
    }
    timestamp: string,
    success: string,
    message: string
}


export interface AttendanceData {
    date: string;
    punchIn: string | null;
    punchInUpdated?: string | null;
    updatedDeduction?: string | null;
    punchOut: string | null;
    punchOutUpdated?: string | null;
    status: 'On Time' | 'Short Time' | 'Overtime';
    statusValue?: string | null;
    travelDeduction?: number;
    locationName?: string;
    breaks?: {
        [key: string]: {
          startTime: string;
          endTime: string;
        };
      };
      workHours:string | 0;
  }
  

export interface ScheduleInfo {
    data: {
        employeeId: string,
        site: string,
        startTime: string,
        endTime: string,
        locationName: string
    }
}

export interface AdminAttendanceData {
    data: {
        employeeId: string,
        firstName: string,
        lastName: string,
        department: string,
        designation: string,
        organization: string,
        date: string,
        punchIn: string,
        punchOut: string,
        status: string
    }
}
