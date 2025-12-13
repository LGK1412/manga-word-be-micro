import { Controller, Get } from '@nestjs/common';
import { GenreService } from './genre.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class GenreController {
  constructor(private readonly genreService: GenreService) { }

  @MessagePattern({ cmd: 'create-genre' })
  async createGenre(data: { name: string, description?: string }) {
    return await this.genreService.createGenre(data.name, data.description)
  }

  @MessagePattern({ cmd: 'update-genre' })
  async updateGenre(data: { id: string, name?: string, description?: string }) {
    return await this.genreService.updateGenre(data.id, data.name, data.description)
  }

  @MessagePattern({ cmd: 'validate-genres' })
  async validateGenre(id: string | string[]) {
    return await this.genreService.validateGenre(id)
  }
}
