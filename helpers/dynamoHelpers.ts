export class dynamoHelpers {
    public putItem(value: string, id?: number) {
        let key = id ? id: Date.now();
        let params = {
            'book_id': {N: id},
            'value': {S: value}
        }
    }
}