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
    date: string,
    empId: string,
    punchIn: string,
    punchOut: string
    status: string
}

export interface ScheduleInfo {
    data: {
        employeeId: string,
        site: string,
        startTime: string,
        endTime: string
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
