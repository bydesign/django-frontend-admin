class Tags {
  constructor() {
    this.tags = {};
  }

  register(tag) {
    tags[tag.name](tag);
  }

  call(tagData) {
    tags[tagData.name](tagData.vars, tagData.content);
  }
}
