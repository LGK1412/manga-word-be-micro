import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Post, Req, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import { ChangePasswordDto } from 'apps/auth/src/Dto/change-password.dto';
import { EmailDto } from 'apps/auth/src/Dto/email.dto';
import { GoogleLoginDto } from 'apps/auth/src/Dto/google-login.dto';
import { LoginDto } from 'apps/auth/src/Dto/login.dto';
import { PassordRecoveryDto } from 'apps/auth/src/Dto/password-recovery.dto';
import { RegisterDto } from 'apps/auth/src/Dto/register.dto';
import { VerifyEmailDto } from 'apps/auth/src/Dto/verifyEmail.dto';
import { CreateGenreDto } from 'apps/genre/src/Dto/create-genre.Schema';
import { UpdateGenreDto } from 'apps/genre/src/Dto/update-genre.Schema';
import { NotiDto } from 'apps/notification/src/Dto/notiId.dto';
import { sendNotificationDto } from 'apps/notification/src/Dto/sendNoti.dto';
import { CreateStoryDto } from 'apps/story/src/Dto/create-story.dto';
import { CreateStyleDto } from 'apps/style/src/Dto/create-style.dto';
import { AccessTokenAdminGuard } from 'libs/Guard/access-token-admin.guard';
import { AccessTokenAuthorGuard } from 'libs/Guard/access-token-author.guard';
import { AccessTokenGuard } from 'libs/Guard/access-token.guard';
import multer, { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { lastValueFrom } from 'rxjs';
import { CreateChapterWithTextDto } from 'apps/chapter/src/Dto/create-chapter-with-text.dto';
import { UpdateChapterWithTextDto } from 'apps/chapter/src/Dto/update-chapter-with-text.dto';
import { CreateImageChapterDto } from 'apps/chapter/src/Dto/create-image-chapter.dto';
import sharp from 'sharp';
import { UpdateImageChapterDto } from 'apps/chapter/src/Dto/update-image-chapter.dto';

const coverImageInterceptor = FileInterceptor('coverImage', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('File không phải ảnh'), false);
    }
    cb(null, true);
  },
});

const imageChapterInterceptor = FilesInterceptor('images', 50, {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('File không phải ảnh'), false)
    }
    cb(null, true)
  },
})

@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private auth: ClientProxy,
    @Inject('USER_SERVICE') private user: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notification: ClientProxy,
    @Inject('STORY_SERVICE') private story: ClientProxy,
    @Inject('GENRE_SERVICE') private genre: ClientProxy,
    @Inject('STYLE_SERVICE') private style: ClientProxy,
    @Inject('CHAPTER_SERVICE') private chapter: ClientProxy,
  ) { }

  // ========== Authentication routes ==========
  @Post('/auth/register')
  async register(@Body() userData: RegisterDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'register' }, userData));

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Registration failed');
    } else {
      return { success: true, message: res.message || 'Registeration successfully' };
    }
  }

  @Post('/auth/send-verification-email')
  async sendVerificationEmail(@Body() data: EmailDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'send_verification_email' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Send verification email failed');
    } else {
      return { success: true, message: res.message || 'Send verification email successfully' };
    }
  }

  @Post('/auth/verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'verify_email' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Verification email failed');
    } else {
      return { success: true, message: res.message || 'Verification email successfully' };
    }
  }

  @Post('/auth/login')
  async login(@Body() data: LoginDto, @Res({ passthrough: true }) response: Response) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'login' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Login failed');
    } else {

      response.cookie('access_token', res.accessToken, {
        httpOnly: true,
        maxAge: 360 * 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: "strict",
      });

      return { success: true, message: res.message || 'Login successfully', accessToken: res.accessToken, tokenPayload: res.tokenPayload };
    }
  }

  @Post('/auth/logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 0,
    })

    return { success: true }
  }

  @Post('/auth/send-password-recovery-email')
  async sendPasswordRecovery(@Body() data: EmailDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'send-password-recovery-email' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Send recovery email failed');
    } else {
      return { success: true, message: res.message || 'Send recovery email successfully' };
    }
  }

  @Post('/auth/verify-password-recovery')
  async verificationRecoveryPassword(@Body() data: PassordRecoveryDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'verification_forgot_password' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Recovery password failed');
    } else {
      return { success: true, message: res.message || 'Recovery password successfully' };
    }
  }

  @UseGuards(AccessTokenGuard)
  @Post('/auth/change-password')
  async changePassword(@Body() data: ChangePasswordDto, @Req() req: Request) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'change_password' }, { password: data.password, user: req?.user }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Change password failed');
    } else {
      return { success: true, message: res.message || 'Change password successfully' };
    }
  }

  @Post('/auth/google-login')
  async googleLogin(@Body() data: GoogleLoginDto, @Res({ passthrough: true }) response: Response) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'google-login' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Login with Google failed');
    } else {
      return { success: true, message: res.message || 'Login with Google successfully' };
    }
  }

  // ========== Story routes ==========

  @Post('/story/create-story/:author_id')
  @UseInterceptors(coverImageInterceptor)
  async createStory(@Body() data: CreateStoryDto, @Req() req: Request, @UploadedFile() file: Express.Multer.File, @Param('author_id') author_id: string) {
    let filename = 'default-cover.png';

    if (file) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      filename = `${unique}${ext}`;
      data.coverImage = filename;
    }

    const res = await lastValueFrom(
      this.story.send({ cmd: 'create-story' }, { author_id, ...data }),
    );

    if (res.success === true) {
      if (file) {
        const filepath = join('public/assets/coverImages', filename);
        await fs.promises.writeFile(filepath, file.buffer);
      }

      return { success: true, message: res.message || 'Create story successfully' };
    } else {
      throw new BadRequestException(res.message || 'Create story failed');
    }
  }

  @Post('/story/update-story/:story_id')
  @UseGuards(AccessTokenAuthorGuard)
  @UseInterceptors(coverImageInterceptor)
  async udpateStory(@Body() data: CreateStoryDto, @Req() req: Request, @UploadedFile() file: Express.Multer.File, @Param('story_id') story_id: string) {
    let filename = 'default-cover.png';
    
    if (file) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      filename = `${unique}${ext}`;
      data.coverImage = filename;
    }

    const res = await lastValueFrom(
      this.story.send({ cmd: 'update-story' }, { author_id: (req as any).author.user_id, story_id, ...data }),
    );

    if (res.success === true) {
      if (file && res.old_image) {
        const oldPath = join('public/assets/coverImages', res.old_image)
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath)
        }
      }

      // 👉 ghi ảnh mới
      if (file && filename) {
        const newPath = join('public/assets/coverImages', filename)
        await fs.promises.writeFile(newPath, file.buffer)
      }

      return { success: true, message: res.message || 'Create story successfully' };
    } else {
      throw new BadRequestException(res.message || 'Create story failed');
    }
  }

  // ========== Chapter routes ==========

  @Post('/chapter/create-text-chapter')
  @UseGuards(AccessTokenAuthorGuard)
  async createTextChapter(@Body() data: CreateChapterWithTextDto, @Req() req: Request) {
    const author_id = (req as any).author.user_id
    const res = await lastValueFrom(this.chapter.send({ cmd: 'create-text-chapter' }, { author_id, ...data }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Text chapter created failed');
    } else {
      return { success: true, message: res.message || 'Text chapter created successfully' };
    }
  }

  @Post('/chapter/update-text-chapter/:chapter_id')
  @UseGuards(AccessTokenAuthorGuard)
  async updateTextChapter(@Body() data: UpdateChapterWithTextDto, @Req() req: Request, @Param('chapter_id') chapter_id: string) {
    const author_id = (req as any).author.user_id
    const res = await lastValueFrom(this.chapter.send({ cmd: 'update-text-chapter' }, { author_id, chapter_id, ...data }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Text chapter update failed');
    } else {
      return { success: true, message: res.message || 'Text chapter update successfully' };
    }
  }

  @Post('/chapter/create-image-chapter')
  @UseGuards(AccessTokenAuthorGuard)
  @UseInterceptors(imageChapterInterceptor)
  async create(
    @Body() data: CreateImageChapterDto,
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const author_id = (req as any).author.user_id

    const filenames: string[] = []

    // 👉 chuẩn bị tên file WEBP
    for (const file of files || []) {
      const name = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.webp`
      filenames.push(name)
    }

    data.images = filenames

    // 👉 gọi service tạo chapter + image-chapter
    const res = await lastValueFrom(
      this.chapter.send(
        { cmd: 'create-image-chapter' },
        { author_id, ...data },
      ),
    )

    if (!res?.success) {
      throw new BadRequestException(res.message || 'Create chapter failed')
    }

    // 👉 SAU KHI DB OK → mới lưu file
    const chapterDir = join(
      process.cwd(),
      'public/uploads/image-chapters',
      res.chapter_id,
    )

    await fs.promises.mkdir(chapterDir, { recursive: true })

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filename = filenames[i]

      await sharp(file.buffer)
        .rotate()
        .webp({ quality: 80 })
        .toFile(join(chapterDir, filename))
    }

    return {
      success: true,
      message: 'Create image chapter successfully',
    }
  }

  @Patch('/chapter/update-image-chapter/:id')
  @UseGuards(AccessTokenAuthorGuard)
  @UseInterceptors(imageChapterInterceptor)
  async update(
    @Param('id') chapterId: string,
    @Body() dto: UpdateImageChapterDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // 1. CHUẨN BỊ LIST ẢNH CŨ (giữ nguyên order)
    const existingImagesWithOrder = (dto.existing_images || []).map((item) => ({
      filename: item.url.split('/').pop()!,
      order: item.order,
    }))

    // 2. CHUẨN BỊ LIST ẢNH MỚI (map với new_images_meta để lấy order)
    const newImagesWithOrder: { filename: string; order: number; buffer: Buffer }[] = []

    // Tạo map meta để tra cứu nhanh: originalname -> order
    const metaMap = new Map<string, number>()
    if (dto.new_images_meta && Array.isArray(dto.new_images_meta)) {
      dto.new_images_meta.forEach((m) => metaMap.set(m.originalname, m.order))
    }

    for (const file of files || []) {
      // Tìm order tương ứng với tên file gốc
      const order = metaMap.has(file.originalname) ? metaMap.get(file.originalname)! : 9999

      // Tạo tên file mới
      const newFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

      newImagesWithOrder.push({
        filename: newFilename,
        order: order,
        buffer: file.buffer, // Giữ buffer để lưu sau
      })
    }

    // 3. GỘP VÀ SẮP XẾP (Merge + Sort)
    const mergedList = [...existingImagesWithOrder, ...newImagesWithOrder]
      .sort((a, b) => a.order - b.order) // Sắp xếp theo order tăng dần

    // Trích xuất mảng string tên file cuối cùng để lưu vào DB
    const finalImages = mergedList.map((i) => i.filename)

    // 4. GỌI MICROSERVICE UPDATE DB
    const res = await lastValueFrom(
      this.chapter.send(
        { cmd: 'update-image-chapter' },
        {
          chapter_id: chapterId,
          title: dto.title,
          price: dto.price,
          order: dto.order,
          is_published: dto.is_published,
          is_completed: dto.is_completed,
          images: finalImages, // Gửi danh sách đã sắp xếp chuẩn
        },
      ),
    )

    if (!res?.success) {
      throw new BadRequestException(res.message || 'Update image chapter failed')
    }

    // 5. XỬ LÝ FILE SYSTEM (Chỉ làm khi DB update thành công)
    const chapterDir = join(
      process.cwd(),
      'public/uploads/image-chapters',
      chapterId,
    )
    await fs.promises.mkdir(chapterDir, { recursive: true })

    // 5.1 Xoá ảnh thừa (Service trả về danh sách cần xoá)
    for (const filename of res.images_to_delete || []) {
      const filePath = join(chapterDir, filename)
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath).catch(e => console.error('Delete file error:', e))
      }
    }

    // 5.2 Lưu ảnh mới (Dùng sharp)
    for (const img of newImagesWithOrder) {
      await sharp(img.buffer)
        .rotate()
        .webp({ quality: 80 })
        .toFile(join(chapterDir, img.filename))
    }

    return {
      success: true,
      message: 'Update image chapter successfully',
    }
  }

  // ========== Genre routes ==========
  @UseGuards(AccessTokenAdminGuard)
  @Post('/genre/create')
  async createGenre(@Body() data: CreateGenreDto, @Req() req: Request) {
    const res = await lastValueFrom(this.genre.send({ cmd: 'create-genre' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Create genre failed');
    } else {
      return { success: true, message: res.message || 'Create genre successfully' };
    }
  }

  @UseGuards(AccessTokenAdminGuard)
  @Patch('/genre/update/:id')
  async updateGenre(@Body() data: UpdateGenreDto, @Req() req: Request, @Param('id') id: string) {
    const res = await lastValueFrom(this.genre.send({ cmd: 'update-genre' }, { id, ...data }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Updated genre failed');
    } else {
      return { success: true, message: res.message || 'Updated genre successfully' };
    }
  }
  
  // ========== Style routes ==========

  @UseGuards(AccessTokenAdminGuard)
  @Post('/style/create')
  async createStyle(@Body() data: CreateStyleDto) {
    const res = await lastValueFrom(this.style.send({ cmd: 'create-style' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Create style failed');
    } else {
      return { success: true, message: res.message || 'Create style successfully' };
    }
  }


  @Patch('/style/update/:id')
  @UseGuards(AccessTokenAdminGuard)
  async updateStyle(@Body() data: CreateStyleDto, @Param('id') id: string) {
    const res = await lastValueFrom(this.style.send({ cmd: 'update-style' }, { id, ...data }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Update style failed');
    } else {
      return { success: true, message: res.message || 'Update style successfully' };
    }
  }
}
