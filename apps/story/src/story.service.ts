import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Story } from 'libs/Schema/story/story.schema';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class StoryService {
  constructor(
    @InjectModel(Story.name) private storyModel,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('STYLE_SERVICE') private readonly styleClient: ClientProxy,
    @Inject('GENRE_SERVICE') private readonly genreClient: ClientProxy,
  ) { }

  async createStory(author_id: string, title: string, summary: string, genres: string[], status?: string, isPublish?: boolean, styles?: string[], isDraft?: boolean, coverImage?: string) {
    const newStory = new this.storyModel({
      title,
      summary,
      genres,
      status,
      isPublish,
      styles,
      isDraft,
      coverImage,
      authorId: author_id
    })

    const existing_user = await lastValueFrom(this.userClient.send({ cmd: 'get-user-by-id' }, author_id))

    if (!existing_user?._id) {
      return { success: false, message: 'User not exists' }
    }

    if (existing_user.role !== 'author') {
      return { success: false, message: 'User is not author' }
    }

    if (existing_user.status === 'ban') {
      return { success: false, message: 'User is banned' }
    }

    const valid_style = await lastValueFrom(this.styleClient.send({ cmd: 'validate-style' }, styles))

    if (!valid_style) {
      return { success: false, message: 'Style is not exist' }
    }

    if (valid_style.status === 'hide') {
      return { success: false, message: 'Style is unavailable' }
    }

    const valid_genres = await lastValueFrom(this.genreClient.send({ cmd: 'validate-genres' }, genres))

    if (!valid_genres || valid_genres.length !== genres.length) {
      return { success: false, message: 'Some genres are not exist' }
    }

    try {
      await newStory.save()
      return { success: true, message: 'Story created successfully' }
    } catch (error) {
      console.log(error)
      return { success: false, message: 'Error when create story' }
    }
  }

  async updateStory(author_id: string, story_id: string, title: string, summary: string, genres: string[], status?: string, isPublish?: boolean, styles?: string[], isDraft?: boolean, coverImage?: string) {
    const updateStory: any = {
      title,
      summary,
      genres,
      status,
      isPublish,
      styles,
      isDraft,
      coverImage,
    };

    const existing_user = await lastValueFrom(this.userClient.send({ cmd: 'get-user-by-id' }, author_id))

    if (!existing_user?._id) {
      return { success: false, message: 'User not exists' }
    }

    if (existing_user.role !== 'author') {
      return { success: false, message: 'User is not author' }
    }

    if (existing_user.status === 'ban') {
      return { success: false, message: 'User is banned' }
    }

    const valid_style = await lastValueFrom(this.styleClient.send({ cmd: 'validate-style' }, styles))

    if (!valid_style) {
      return { success: false, message: 'Style is not exist' }
    }

    if (valid_style.status === 'hide') {
      return { success: false, message: 'Style is unavailable' }
    }

    const valid_genres = await lastValueFrom(this.genreClient.send({ cmd: 'validate-genres' }, genres))

    if (!valid_genres || valid_genres.length !== genres.length) {
      return { success: false, message: 'Some genres are not exist' }
    }

    const old_image = await this.storyModel.findById(story_id).select('coverImage -_id')

    try {
      await this.storyModel.findByIdAndUpdate(story_id, updateStory)
      return { success: true, old_image: old_image.coverImage, message: 'Story updated successfully' }
    } catch (error) {
      console.log(error)
      return { success: false, message: 'Error when update story' }
    }
  }

  async getStoryById(story_id: string) {
    return await this.storyModel.findById(story_id)
  }
}
