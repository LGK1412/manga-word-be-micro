import { Controller, Get } from '@nestjs/common';
import { StoryService } from './story.service';

@Controller()
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  getHello(): string {
    return this.storyService.getHello();
  }
}
