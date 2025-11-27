import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('profile')
  getProfile() {
    return {
      id: 1,
      name: 'Himasha',
      email: 'himasha@mock.dev',
    };
  }
}