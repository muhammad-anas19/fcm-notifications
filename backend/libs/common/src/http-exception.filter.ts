import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/** One consistent error shape for the whole API — see docs/05-api-design.md. Deliberately
 * never leaks internals (stack traces, queue/exchange names, DB error text) into the
 * response body; those go to the server log only (docs/11-security.md). */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message = isHttpException
      ? typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] })?.message ?? exception.message)
      : 'Internal server error';

    if (!isHttpException) {
      this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, (exception as Error)?.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
