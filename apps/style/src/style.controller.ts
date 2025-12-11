import { Controller, Get } from '@nestjs/common';
import { StyleService } from './style.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class StyleController {
  constructor(private readonly styleService: StyleService) { }

  @MessagePattern({ cmd: 'create-style' })
  async createStyle(data: { name: string, description: string, status?: string }) {
    return await this.styleService.createStyle(data.name, data.description, data.status)
  }

  @MessagePattern({ cmd: 'update-style' })
  async updateStyle(data: { id: string, name: string, description: string, status?: string }) {
    return await this.styleService.updateStyle(data.id, data.name, data.description, data.status)
  }
}
