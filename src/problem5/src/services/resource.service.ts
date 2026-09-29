import { Between, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { AppDataSource } from "@src/db/data-source";
import { NotFoundError } from "@src/errors";
import { Resource } from "@src/entities/resource.entity";
import { CreateResourceInput, ListResourcesQuery, UpdateResourceInput } from "@src/schemas/resource.schema";
import { QueryUtils } from "@src/utils/query.utils";

export class ResourceService {
  constructor(private readonly repo: Repository<Resource> = AppDataSource.getRepository(Resource)) {}

  async create(input: CreateResourceInput) {
    const resource = this.repo.create(input);
    return this.repo.save(resource);
  }

  async list(query: ListResourcesQuery) {
    const where: FindOptionsWhere<Resource> = {};
    if (query.name) where.name = ILike(`%${QueryUtils.escapeLike(query.name)}%`);
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.createdFrom && query.createdTo) where.createdAt = Between(query.createdFrom, query.createdTo);
    else if (query.createdFrom) where.createdAt = MoreThanOrEqual(query.createdFrom);
    else if (query.createdTo) where.createdAt = LessThanOrEqual(query.createdTo);

    const [data, total] = await this.repo.findAndCount({
      where,
      order: QueryUtils.buildOrder(query.sort),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        sort: query.sort,
      },
    };
  }

  async get(id: string) {
    const resource = await this.repo.findOneBy({ id });
    if (!resource) throw new NotFoundError();
    return resource;
  }

  async update(id: string, input: UpdateResourceInput) {
    const resource = await this.get(id);
    this.repo.merge(resource, input);
    return this.repo.save(resource);
  }

  async remove(id: string) {
    const result = await this.repo.delete({ id });
    if (!result.affected) throw new NotFoundError();
  }
}
