import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const baseMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any)?.message ?? 'Internal server error';

    // Log detailed error to help debug OAuth issues.
    // We avoid using Nest's logger so the output appears even before logger init.
    console.error('--- GLOBAL EXCEPTION ---');
    console.error('URL:', request.url);
    console.error('Status:', status);
    console.error('Message:', (exception as any)?.message);
    if ((exception as any)?.stack) {
      console.error((exception as any).stack);
    }
    if ((exception as any)?.oauthError) {
      console.error('OAuth Error:', (exception as any).oauthError);
    }
    console.error('------------------------');

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: baseMessage,
    });
  }
}
