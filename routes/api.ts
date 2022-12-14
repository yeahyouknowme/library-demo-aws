'use strict';
const uuidv4 = require('uuid').v4;

module.exports = function apiRoutes(app, dynamodb) {

    app.route('/api/books')
        .get(function (req, res){
            //response will be array of book objects
            //json res format: [{"id": bookid, "title": book_title, "commentcount": num_of_comments },...]
            
            let params = {
                TableName: 'books',
                ProjectionExpression: 'id, title, commentcount',
            }
            //scan all books in db
            dynamodb.scan(params, function(err, data) {
                if (err) {
                    res.send('error: ' + err);
                } else {
                    res.json(data);
                }
            });
            //err: res.json('error '.concat(err))
            //success: res.json([...data]);
        })
        .post(function (req, res){
            let title = req.body.title;
            let newUUID = uuidv4();
            //response will contain new book object including atleast id and title

            if(title) {
                let params = {
                    TableName: 'books',
                    Item: {
                        'id': {S: newUUID},
                        'title': {S: title},
                        'comments': {L: []},
                        'commentcount': {N: '0'}
                    },
                    ReturnConsumedCapacity: 'TOTAL'
                }
                // POST - create a new book
                dynamodb.putItem(params, function (err, data) {
                    if (err) {
                        res.json('error '.concat(err));
                    } else {
                        res.send({
                            "id": newUUID,
                            "title": title
                        });
                    }
                })
            } 
            else {
                res.json('missing required field "Book Title"')
            }

        });
    
    app.route('/api/books/:id')
        .get(function (req, res){
            let bookID = req.params.id;
            //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}

            let params = {
                TableName: 'books',
                Key: {
                    'id': {
                        S: bookID
                    }
                }
            }
            //GET - find book by ID
            dynamodb.getItem(params, function (err, data) {
                if (err){
                    res.json('error: no book found with id '.concat(bookID));
                } else {
                    res.send({
                        "id": data.Item.id,
                        "title": data.Item.title,
                        "comments": data.Item.comments
                    })
                }
            })
        })
        .post(function(req, res){
            let bookID = req.params.id;
            let comment = req.body.comment;
            console.log(req.body)
            let params = {
                TableName: 'books',
                Key: {
                    "id": {
                        S: bookID
                    }
                },
                ExpressionAttributeNames: {
                    "#cc": "commentcount",
                    "#c": "comments"
                },
                ExpressionAttributeValues: {
                    ":inc": {N: "1"},
                    ":comment": {L: [{S: comment}]}
                },
                UpdateExpression: 'ADD #cc :inc SET #c = list_append(#c, :comment)',
                ReturnValues: "ALL_NEW"
            } 
            //POST - add a comment to a book
            dynamodb.updateItem(params, function (err, data) {
                if(!comment) res.json('missing required field "Comment"');
                if (err) {
                    res.json('error: ' + err + ' '+ comment);
                } else {
                    res.send({
                        id: data.Attributes.id,
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
            dynamodb.deleteItem(params, function (err, data) {
                if (err) {
                    res.json('error: no book found with id '.concat(bookID));
                } else {
                    res.json('delete successful');
                }
            })
        });
  
};
