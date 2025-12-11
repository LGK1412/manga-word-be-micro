import { Injectable } from '@nestjs/common';

@Injectable()
export class StoryService {
  getHello(): string {
    return 'Hello World!';
  }
}
