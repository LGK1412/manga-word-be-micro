import { Controller } from '@nestjs/common';
import { StoryService } from './story.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class StoryController {
  constructor(private readonly storyService: StoryService) { }

  @MessagePattern({ cmd: 'create-story' })
  async createStory(data: { author_id: string, title: string, summary: string, genres: string[], status?: string, isPublish?: boolean, styles?: string[], isDraft?: boolean, coverImage?: string }) {
    const res = await this.storyService.createStory(data.author_id, data.title, data.summary, data.genres, data.status, data.isPublish, data.styles, data.isDraft, data.coverImage);

    if (res.success !== true) {
      return { success: false, message: res.message || 'Create story failed' };
    } else {
      return { success: true, message: res.message || 'Create story successfully' };
    }
  }

  @MessagePattern({ cmd: 'update-story' })
  async updateStory(data: { author_id: string, story_id: string, title: string, summary: string, genres: string[], status?: string, isPublish?: boolean, styles?: string[], isDraft?: boolean, coverImage?: string }) {
    const res = await this.storyService.updateStory(data.author_id, data.story_id, data.title, data.summary, data.genres, data.status, data.isPublish, data.styles, data.isDraft, data.coverImage);

    if (res.success !== true) {
      return { success: false, message: res.message || 'Update story failed' };
    } else {
      return { success: true, message: res.message || 'Update story successfully' };
    }
  }
}
