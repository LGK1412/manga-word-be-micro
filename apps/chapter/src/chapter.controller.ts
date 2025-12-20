import { Controller, Get } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) { }

  @MessagePattern({ cmd: 'create-text-chapter' })
  async createTextChapter(data: { author_id: string, title: string; manga_id: string; price?: number; order?: number; isPublished?: boolean; content: string; is_completed?: boolean }) {
    const res = await this.chapterService.createTextChapter(data.author_id, data.title, data.manga_id, data.price, data.order, data.isPublished, data.content, data.is_completed)
    if (res.success === true) {
      return { success: true, message: res.message || 'Text chapter created successfully' }
    } else {
      return { success: false, message: res.message || 'Failed to create text chapter' }
    }
  }

  @MessagePattern({ cmd: 'update-text-chapter' })
  async updateTextChapter(data: { author_id: string, chapter_id: string, title: string; price?: number, order?: number, isPublished?: boolean; content: string, is_completed?: boolean }) {
    const res = await this.chapterService.updateTextChapter(data.author_id, data.chapter_id, data.title, data.price, data.order, data.isPublished, data.content, data.is_completed)

    if (res.success === true) {
      return { success: true, message: res.message || 'Text chapter update successfully' }
    } else {
      return { success: false, message: res.message || 'Failed to update text chapter' }
    }
  }

  @MessagePattern({ cmd: 'create-image-chapter' })
  async createImageChapter(data: { author_id: string, title: string; manga_id: string; price?: number; order?: number; is_published?: boolean; is_completed?: boolean, images: string[] }) {
    const res = await this.chapterService.createImageChapter(data.author_id, data.title, data.manga_id, data.price, data.order, data.is_published, data.is_completed, data.images)

    if (res.success === true) {
      return { success: true, chapter_id: res.chapter_id, message: res.message || 'Image chapter create successfully' }
    } else {
      return { success: false, message: res.message || 'Failed to create image chapter' }
    }
  }

  @MessagePattern({ cmd: 'update-image-chapter' })
  async updateImageChapter(data: {
    chapter_id: string
    title?: string
    price?: number
    order?: number
    is_published?: boolean
    is_completed?: boolean
    images?: string[]
  }) {
    return await this.chapterService.updateImageChapter(data)
  }


}
