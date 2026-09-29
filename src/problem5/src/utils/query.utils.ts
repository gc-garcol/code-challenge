import { FindOptionsOrder } from "typeorm";
import { Resource } from "@src/entities/resource.entity";
import { SortItem } from "@src/schemas/resource.schema";

export class QueryUtils {
  static escapeLike(value: string) {
    return value.replace(/[\\%_]/g, (char) => `\\${char}`);
  }

  static toDirection(order: SortItem["order"]) {
    return order === "asc" ? "ASC" : "DESC";
  }

  static buildOrder(sort: SortItem[]): FindOptionsOrder<Resource> {
    const order: FindOptionsOrder<Resource> = {};
    for (const { field, order: direction } of sort) order[field] = QueryUtils.toDirection(direction);
    order.id = QueryUtils.toDirection(sort[sort.length - 1]?.order ?? "asc");
    return order;
  }
}
