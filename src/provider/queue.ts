import * as dedupe from "dedupe";
import {
  Event,
  EventEmitter,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import { SongsItem } from "../constant";
import { lock } from "../state";
import { unsortInplace } from "array-unsort";

export class QueueProvider implements TreeDataProvider<QueueItemTreeItem> {
  private static instance: QueueProvider;

  private _onDidChangeTreeData: EventEmitter<QueueItemTreeItem | void> = new EventEmitter<QueueItemTreeItem | void>();

  readonly onDidChangeTreeData: Event<QueueItemTreeItem | void> = this
    ._onDidChangeTreeData.event;

  static songs: QueueItemTreeItem[] = [];

  static getInstance(): QueueProvider {
    return this.instance || (this.instance = new QueueProvider());
  }

  static async refresh(action: () => Promise<void>): Promise<void> {
    if (!lock.queue) {
      lock.queue = true;
      await action();
      this.instance._onDidChangeTreeData.fire();
      lock.queue = false;
    }
  }

  getTreeItem(element: QueueItemTreeItem): TreeItem {
    return element;
  }

  async getChildren(): Promise<QueueItemTreeItem[]> {
    return QueueProvider.songs;
  }

  static clear(): void {
    QueueProvider.songs = [];
  }

  static random(): void {
    QueueProvider.songs = [QueueProvider.songs[0]].concat(
      unsortInplace(QueueProvider.songs.slice(1))
    );
  }

  static top(id: number): void {
    this.shift(this.songs.findIndex((value) => value.valueOf() === id));
  }

  static shift(index: number): void {
    if (index) {
      while (index < 0) {
        index += QueueProvider.songs.length;
      }
      QueueProvider.songs = QueueProvider.songs
        .slice(index)
        .concat(QueueProvider.songs.slice(0, index));
    }
  }

  static add(elements: QueueItemTreeItem[]): void {
    QueueProvider.songs = dedupe(
      QueueProvider.songs.concat(elements),
      (element: QueueItemTreeItem) => element.valueOf()
    );
  }

  static delete(id: number): void {
    const index = this.songs.findIndex((value) => value.valueOf() === id);
    if (index >= 0) {
      QueueProvider.songs.splice(index, 1);
    }
  }
}

export class QueueItemTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly item: SongsItem,
    public readonly pid: number,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }

  valueOf(): number {
    return this.item.id;
  }

  description = (() => {
    const arName: string[] = [];
    for (const i of this.item.ar) {
      arName.push(i.name);
    }
    return arName.join("/");
  })();

  iconPath = new ThemeIcon("zap");

  contextValue = "QueueItemTreeItem";
}
