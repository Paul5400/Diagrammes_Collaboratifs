import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addHook('onRequest', (req, res, next) => {
    // @ts-expect-error Fastify n'utilise pas setHeader, on le mappe pour Passport
    res.setHeader = function (key: string, value: string) {
      return this.header(key, value);
    };
    // @ts-expect-error Harmonisation de l'API Express
    res.end = function () {
      this.send();
    };
    next();
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
