import type { Song, SongNode } from '../models/Song';

export class DoublyLinkedList {
  private head: SongNode | null = null;
  private tail: SongNode | null = null;
  private currentNode: SongNode | null = null;
  private _size: number = 0;

  size(): number {
    return this._size;
  }

  getCurrentNode(): SongNode | null {
    return this.currentNode;
  }

  setCurrentNode(node: SongNode | null): void {
    this.currentNode = node;
  }

  addToEnd(song: Song): void {
    const node: SongNode = { song, prev: null, next: null };
    if (!this.tail) {
      this.head = node;
      this.tail = node;
      this.currentNode = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this._size++;
  }

  addToStart(song: Song): void {
    const node: SongNode = { song, prev: null, next: null };
    if (!this.head) {
      this.head = node;
      this.tail = node;
      this.currentNode = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this._size++;
  }

  addAtPosition(song: Song, position: number): void {
    if (position <= 0) {
      this.addToStart(song);
      return;
    }
    if (position >= this._size) {
      this.addToEnd(song);
      return;
    }

    let current = this.head;
    let index = 0;
    while (current && index < position) {
      current = current.next;
      index++;
    }

    if (!current) {
      this.addToEnd(song);
      return;
    }

    const node: SongNode = { song, prev: current.prev, next: current };
    if (current.prev) {
      current.prev.next = node;
    }
    current.prev = node;
    this._size++;
  }

  remove(id: string): void {
    let current = this.head;
    while (current) {
      if (current.song.id === id) {
        if (current.prev) {
          current.prev.next = current.next;
        } else {
          this.head = current.next;
        }
        if (current.next) {
          current.next.prev = current.prev;
        } else {
          this.tail = current.prev;
        }
        if (this.currentNode?.song.id === id) {
          this.currentNode = current.next ?? current.prev ?? null;
        }
        this._size--;
        return;
      }
      current = current.next;
    }
  }

  next(): SongNode | null {
    if (!this.currentNode) return null;
    if (this.currentNode.next) {
      this.currentNode = this.currentNode.next;
      return this.currentNode;
    }
    return null;
  }

  prev(): SongNode | null {
    if (!this.currentNode) return null;
    if (this.currentNode.prev) {
      this.currentNode = this.currentNode.prev;
      return this.currentNode;
    }
    return null;
  }

  wrapNext(): SongNode | null {
    if (!this.currentNode) return null;
    if (this.currentNode.next) {
      this.currentNode = this.currentNode.next;
    } else {
      this.currentNode = this.head;
    }
    return this.currentNode;
  }

  wrapPrev(): SongNode | null {
    if (!this.currentNode) return null;
    if (this.currentNode.prev) {
      this.currentNode = this.currentNode.prev;
    } else {
      this.currentNode = this.tail;
    }
    return this.currentNode;
  }

  search(query: string): SongNode[] {
    const results: SongNode[] = [];
    const lower = query.toLowerCase();
    let current = this.head;
    while (current) {
      if (
        current.song.title.toLowerCase().includes(lower) ||
        current.song.artist.toLowerCase().includes(lower) ||
        current.song.album.toLowerCase().includes(lower)
      ) {
        results.push(current);
      }
      current = current.next;
    }
    return results;
  }

  toggleFavorite(id: string): void {
    let current = this.head;
    while (current) {
      if (current.song.id === id) {
        current.song.isFavorite = !current.song.isFavorite;
        return;
      }
      current = current.next;
    }
  }

  shuffle(): void {
    const songs = this.toArray().map((n) => n.song);
    const currentId = this.currentNode?.song.id;

    // Fisher-Yates shuffle
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = songs[i] as Song;
      songs[i] = songs[j] as Song;
      songs[j] = temp;
    }

    // Rebuild list
    this.head = null;
    this.tail = null;
    this._size = 0;
    this.currentNode = null;

    for (const song of songs) {
      this.addToEnd(song);
    }

    // Restore currentNode pointer
    if (currentId) {
      this.currentNode = this.findNodeById(currentId);
    }
  }

  private findNodeById(id: string): SongNode | null {
    let node: SongNode | null = this.head;
    while (node !== null) {
      if (node.song.id === id) return node;
      node = node.next;
    }
    return null;
  }

  toArray(): SongNode[] {
    const result: SongNode[] = [];
    let current = this.head;
    while (current) {
      result.push(current);
      current = current.next;
    }
    return result;
  }

  getHead(): SongNode | null {
    return this.head;
  }
}
