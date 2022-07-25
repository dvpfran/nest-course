import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { DataSource, Repository } from 'typeorm';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Coffee } from './entities/coffee.entity';
import { Flavor } from './entities/flavor.entity';
import { Event } from '../events/entities/event.entity';
// import { COFFEE_BRANDS } from './coffees.constants';
import coffeesConfig from './config/coffees.config';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>, // private readonly dataSource: DataSource, // @Inject(COFFEE_BRANDS) coffeeBrands: string[], // private readonly configService: ConfigService, // @Inject(coffeesConfig.KEY) // private readonly injectedCoffeesConfig: ConfigType<typeof coffeesConfig>,
  ) {
    // const databaseHost = this.configService.get<string>(
    //   'DATABASE_HOSTTT',
    //   'localhost',
    // );
    // const databaseHost = this.configService.get('database.host', 'localhost');
    // console.log(databaseHost);
    // const normalCoffeesConfig = this.configService.get('coffees');
    // console.log(normalCoffeesConfig);
    // console.log(injectedCoffeesConfig);
  }

  // findAll(paginationQuery: PaginationQueryDto) {
  //   const { limit, offset } = paginationQuery;
  //   return this.coffeeRepository.find({
  //     relations: {
  //       flavors: true,
  //     },
  //     skip: offset,
  //     take: limit,
  //   });
  // }

  findAll() {
    return this.coffeeRepository.find({
      relations: {
        flavors: true,
      },
    });
  }

  async findOne(id: string) {
    const coffee = await this.coffeeRepository.findOne({
      where: {
        id: +id,
      },
      relations: {
        flavors: true,
      },
    });
    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return coffee;
  }

  async create(createCoffeeDto: CreateCoffeeDto) {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map((name) => this.preloadFlavorByName(name)),
    );

    const coffee = this.coffeeRepository.create({
      ...createCoffeeDto,
      flavors,
    });
    return this.coffeeRepository.save(coffee);
  }

  async update(id: string, updaterCoffeeDto: UpdateCoffeeDto) {
    const flavors =
      updaterCoffeeDto.flavors &&
      (await Promise.all(
        updaterCoffeeDto.flavors.map((name) => this.preloadFlavorByName(name)),
      ));

    const coffee = await this.coffeeRepository.preload({
      id: +id,
      ...updaterCoffeeDto,
      flavors,
    });

    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }

    return this.coffeeRepository.save(coffee);
  }

  async remove(id: string) {
    const coffee = await this.findOne(id); // automatic handling error
    return this.coffeeRepository.remove(coffee);
  }

  // async recommendCoffee(coffee: Coffee) {
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     coffee.recomendations++;

  //     const recommendEvent = new Event();
  //     recommendEvent.name = 'recommend_coffee';
  //     recommendEvent.type = 'coffee';
  //     recommendEvent.payload = { coffeeId: coffee.id };

  //     await queryRunner.manager.save(coffee);
  //     await queryRunner.manager.save(recommendEvent);

  //     await queryRunner.commitTransaction();
  //   } catch (err) {
  //     await queryRunner.rollbackTransaction();
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFlavor = await this.flavorRepository.findOne({
      where: { name },
    });
    if (existingFlavor) {
      return existingFlavor;
    }
    return this.flavorRepository.create({ name });
  }
}
