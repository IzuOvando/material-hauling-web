class Node<T> {
  public data: T;
  public next: Node<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

export class Queue<T> {
  private size: number;
  private head: Node<T> | null;

  constructor() {
    this.size = 0;
    this.head = null;
  }

  public isEmpty(): boolean {
    return this.size === 0;
  }

  public enqueue(data: T): void {
    const newNode = new Node(data);
    newNode.next = this.head;
    this.head = newNode;
    this.size++;
  }

  public dequeue(): T | null {
    if (this.head === null) return null;
    const data = this.head.data;
    this.head = this.head.next;
    this.size--;
    return data;
  }

  public getSize(): number {
    return this.size;
  }

  public static fromArray<T>(arr: T[]): Queue<T> {
    const queue = new Queue<T>();
    arr.forEach((data) => queue.enqueue(data));
    return queue;
  }

  public static fromSet<T>(set: Set<T>): Queue<T> {
    const queue = new Queue<T>();
    set.forEach((data) => queue.enqueue(data));
    return queue;
  }
}
