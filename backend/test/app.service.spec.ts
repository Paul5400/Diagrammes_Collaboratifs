import { AppService } from '../src/app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('doit retourner un message de bienvenue', () => {
    expect(service.getHello()).toBe('Hello World!');
  });
});