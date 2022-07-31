'use strict';
import {v4 as uuidv4} from 'uuid';

exports = function (app, dynamodb) {

    app.route('/api/books')
        .get(function (req, res){
            //response will be array of book objects
            //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
            
            let params = {
                TableName: 'books',
                ProjectionExpression: '_id, title, commentcount',
            }
            //scan all books in db
            dynamodb.scan(params, function(err, data) {
                if (err) {
                    res.send('error: ' + err);
                } else {
                    res.json(data.Items);
                }
            });
            //err: res.json('error '.concat(err))
            //success: res.json([...data]);
        })
        .post(function (req, res){
            let title = req.body.title;
            //response will contain new book object including atleast _id and title

            if(title) {
                let params = {
                    TableName: 'books',
                    Item: {
                        'uuid': {S: uuidv4()},
                        'title': {S: title},
                        'comments': {L: []},
                        'commentcount': {N: '0'}
                    },
                    ReturnConsumedCapacity: 'TOTAL'
                }
                // POST - create a new book
                dynamodb.put(params, function (err, data) {
                    if (err) {
                        res.json('error '.concat(err));
                    } else {
                        res.send({
                            id: data.uuid,
                            title: data.title
                        });
                    }
                })
            } 
            else {
                res.json('missing required field "Book Title"')
            }

        })
        .delete(function(req, res){
            //if successful response will be 'complete delete successful'

            //DELETE - delete all books
            let deleteParams = {
                TableName: 'books'
            };
            dynamodb.deleteTable(deleteParams, function(err, data) {
                if (err) {
                    res.json('error '.concat(err));
                } else {
                    let newTableParams = {
                        TableName: 'books',
                        AttributeDefinitions: [
                            {
                                AttributeName: 'value',
                                AttributeType: 'S'
                            }
                        ],
                        KeySchema: [
                            {
                                AttributeName: 'uuid',
                                KeyType: 'HASH'
                            }
                        ],
                        BillingMode: 'PAY_PER_REQUEST'
                    }
                    dynamodb.createTable(newTableParams, function(err, data) {
                        if (err) {
                            res.json('error '.concat(err));
                        } else {
                            res.json('complete delete successful');
                        }
                    })
                }
            })
        });
    
    app.route('/api/books/:id')
        .get(function (req, res){
            let bookID = req.params.id;
            //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}

            let params = {
                TableName: 'books',
                Key: {
                    'uuid': {
                        S: bookID
                    }
                }
            }
            //GET - find book by ID
            dynamodb.get(params, function (err, data) {
                if (err){
                    res.json('error: no book found with id '.concat(bookID));
                } else {
                    res.send({
                        id: data.Item.uuid,
                        title: data.Item.title,
                        comments: data.Item.comments
                    })
                }
            })
        })
        .post(function(req, res){
            let bookID = req.params.id;
            let comment = req.body.comment;

            let params = {
                TableName: 'books',
                Key: {
                    "uuid": {
                        S: bookID
                    }
                },
                ExpressionAttributeNames: {
                    "#c": "commentcount",
                    "#c1": "comments"
                },
                ExpressionAttributeValues: {
                    ":c": {
                        SS: comment
                    },
                    ":c1": {
                        N: "1"
                    }
                },
                UpdateExpression: "SET #c = #c + :c1, #c1 = list_append(#c1, :c)",
                ReturnValues: "ALL_NEW"
            } 
            //POST - add a comment to a book
            dynamodb.update(params, function (err, data) {
                if(!comment) res.json('missing required field "Comment"');
                if (err) {
                    res.json('error: no book found with id '.concat(bookID));
                } else {
                    res.send({
                        id: data.Attributes.uuid,
                        title: data.Attributes.title,
                        comments: data.Attributes.comments
                    })
                }
            })
        })
        
        .delete(function(req, res){
            let bookID = req.params.id;

            let params = {
                TableName: 'books',
                Key: {
                    "uuid": {
                        S: bookID
                    }
                },
            }
            //DELETE - delete a book
            dynamodb.delete(params, function (err, data) {
                if (err) {
                    res.json('error: no book found with id '.concat(bookID));
                } else {
                    res.json('delete successful');
                }
            })
        });
  
};
