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
        message: string
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
