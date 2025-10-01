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

export interface NotificationsApiResponse {
    status: 'success' | 'error';
    message?: string;
    timestamp: string; // ISO 8601
    data: {
      notificationReceived: NotificationReceivedItem[];
      notificationSent: NotificationSentItem[];
    };
  }
  
  export interface NotificationReceivedItem {
    notificationId: string;
    type: string;
    title: string;
    message: string;
    read: boolean | string; // backend may send boolean or string "true"/"false"
    createdAt: string; // ISO 8601
    persistent: boolean;
    source: { id: string; name: string };
    targetData?: any[] | null;
    recipients :null;
    icon?: string;  
  }
  
  export interface NotificationRecipient {
    id?: string;              
    employeeId?: string;
    name?: string;
    organization?: string;
    department?: string;
    designation?: string;
    status?: string;          
  }
  
  export interface NotificationSentItem {
    notificationId: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    persistent: boolean;
    source: { id: string; name: string };
    read?: boolean | string;
    recipients?: NotificationRecipient[];
    targetData?: any | null;
    icon?: string;    
  }
  

  export type NotificationType = 'received' | 'sent';
  export interface NotificationItem {
    data: NotificationReceivedItem | NotificationSentItem;
    type: NotificationType;
  }