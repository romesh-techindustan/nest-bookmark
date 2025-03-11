import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, UpdatePasswordDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    console.log(dto);
    try{
          // hash the password
          const password = await argon.hash(dto.password);
          console.log(password);
          // save user to database
          const user = await this.prisma.user.create({
            data: {
              email: dto.email,
              password,
            },
          });
          
          // Remove password before returning
          const { password: _, ...userWithoutPassword } = user;
          return {
            data: userWithoutPassword,
            message: 'User created successfully.',
          };
    } catch(error){
        if (error instanceof PrismaClientKnownRequestError){
            if (error.code==="P2002"){
                throw new ForbiddenException('User already exist.')
            }
        }
        throw error
    }
  }

  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid credentials.');
    }
    // Compare hashed passwords
    await validatePassword(dto.password, user.password);

    const { password, ...userWithoutPassword } = user;

    return {
      data: userWithoutPassword,
      message: 'Login successful.',
    };
  }

  async changePassword(dto: UpdatePasswordDto) {
    let user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new NotFoundException('User does not exist.');
    }
    await validatePassword(dto.password, user.password);

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'Password does not matched',
      );
    }
    const newPassword = await argon.hash(
      dto.confirmPassword,
    );
    user = await this.prisma.user.update({
      where: {
        email: dto.email,
      },
      data: {
        password: newPassword,
      },
    });
    const { password, ...userWithoutPassword } = user;
    return {
      data: userWithoutPassword,
      message: 'Changed password successfully.',
    };
  }
}

async function validatePassword(
  password: string,
  hashedPassword: string,
): Promise<void> {
  const isPasswordValid = await argon.verify(
    hashedPassword,
    password,
  );
  if (!isPasswordValid) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Invalid credentials.',
      error: 'Bad Request',
    });
  }
}
