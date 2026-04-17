import { CallHandler, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, NestInterceptor, StreamableFile } from "@nestjs/common";
import { error, timeStamp } from "console";
import { catchError, map, Observable, throwError } from "rxjs";

export interface ApiResponse<T> {
    success: boolean
    statusCode: number
    data?: T
    error?: string
    message?: string
    timestamp: string
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | StreamableFile> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | StreamableFile>{
        const ctx = context.switchToHttp()
        const response = ctx.getResponse()

        return next.handle().pipe(
            map(data => {
                if (data instanceof StreamableFile) {
                    return data
                }
                return {
                    success: true,
                    statusCode: response.statusCode,
                    data: data,
                    timestamp: new Date().toISOString()
                }
            }),
            catchError(err => {
                const status = err instanceof HttpException
                ? err.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR
                
                return throwError(() => err)
            })
        )
    }
}