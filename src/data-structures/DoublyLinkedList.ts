import type { SongData, SongNode } from '../models/Song';

export class DoublyLinkedList {
  private head: SongNode | null = null;
  private tail: SongNode | null = null;
  private currentNode: SongNode | null = null;
  private _size: number = 0;

  private createNode(data: SongData): SongNode {
    return { ...data, prev: null, next: null };
  }

  size(): number {
    return this._size;
  }

  getCurrent(): SongNode | null {
    return this.currentNode;
  }

  setCurrent(id: string): void {
    let node = this.head;
    while (node !== null) {
      if (node.id === id) {
        this.currentNode = node;
        return;
      }
      node = node.next;
    }
  }

  addToStart(song: SongData): void {
    const node = this.createNode(song);
    if (this.head === null) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    if (this._size === 0) this.currentNode = node;
    this._size++;
  }

  addToEnd(song: SongData): void {
    const node = this.createNode(song);
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    if (this._size === 0) this.currentNode = node;
    this._size++;
  }

  addAtPosition(song: SongData, position: number): void {
    const clampedPosition = Math.max(0, Math.min(position, this._size));
    if (clampedPosition === 0) {
      this.addToStart(song);
      return;
    }
    if (clampedPosition === this._size) {
      this.addToEnd(song);
      return;
    }
    const node = this.createNode(song);
    let current = this.head;
    for (let i = 0; i < clampedPosition - 1; i++) {
      current = current!.next;
    }
    const after = current!.next;
    node.prev = current;
    node.next = after;
    current!.next = node;
    if (after !== null) after.prev = node;
    this._size++;
  }

  remove(id: string): void {
    let node = this.head;
    while (node !== null) {
      if (node.id === id) {
        if (node.prev !== null) node.prev.next = node.next;
        else this.head = node.next;

        if (node.next !== null) node.next.prev = node.prev;
        else this.tail = node.prev;

        if (this.currentNode?.id === id) {
          this.currentNode = node.next ?? node.prev ?? null;
        }

        node.prev = null;
        node.next = null;
        this._size--;
        return;
      }
      node = node.next;
    }
  }

  next(): SongNode | null {
    if (this.currentNode?.next !== null && this.currentNode?.next !== undefined) {
      this.currentNode = this.currentNode.next;
    } else {
      this.currentNode = this.head;
    }
    return this.currentNode;
  }

  prev(): SongNode | null {
    if (this.currentNode?.prev !== null && this.currentNode?.prev !== undefined) {
      this.currentNode = this.currentNode.prev;
    } else {
      this.currentNode = this.tail;
    }
    return this.currentNode;
  }

  search(query: string): SongNode[] {
    const lower = query.toLowerCase();
    const results: SongNode[] = [];
    let node = this.head;
    while (node !== null) {
      if (
        node.title.toLowerCase().includes(lower) ||
        node.artist.toLowerCase().includes(lower)
      ) {
        results.push(node);
      }
      node = node.next;
    }
    return results;
  }

  toggleFavorite(id: string): void {
    let node = this.head;
    while (node !== null) {
      if (node.id === id) {
        node.isFavorite = !node.isFavorite;
        return;
      }
      node = node.next;
    }
  }

  shuffle(): void {
    if (this._size <= 1) return;
    const arr = this.toArray();

    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // Rebuild linked list from shuffled array
    this.head = null;
    this.tail = null;
    this._size = 0;
    const previousCurrentId = this.currentNode?.id ?? null;
    this.currentNode = null;

    for (const song of arr) {
      this.addToEnd({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        isFavorite: song.isFavorite,
        albumArt: song.albumArt,
      });
    }

    // Restore current node pointer
    if (previousCurrentId !== null) {
      this.setCurrent(previousCurrentId);
    }
  }

  toArray(): SongNode[] {
    const result: SongNode[] = [];
    let node = this.head;
    while (node !== null) {
      result.push(node);
      node = node.next;
    }
    return result;
  }
}
