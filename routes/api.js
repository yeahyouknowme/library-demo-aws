/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

exports = function (app, BookModel) {

    app.route('/api/books')
        .get(function (req, res){
            //response will be array of book objects
            //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]

            BookModel.find({}, function(err, data){
                if(err){
                    res.json('error '.concat(err))
                } else if(data) {
                    res.json([...data]);
                }
            })
        })
        
        .post(function (req, res){
            let title = req.body.title;
            //response will contain new book object including atleast _id and title

            if(title) {
                let newBook = new BookModel({
                    title: title,
                    comments: [],
                    commentcount: 0
                })

                newBook.save(function(err, data){
                    if(err) return console.error(err);
                    res.send({
                        _id: data._id,
                        title: data.title
                    });
                })
            } else {
                res.json('missing required field title')
            }

        })
        
        .delete(function(req, res){
            //if successful response will be 'complete delete successful'

            BookModel.deleteMany({}, function(err, removed){
                if(err) {
                    res.send({});
                } else{
                    res.json('complete delete successful')
                }
            })
        });
    
    
    
    app.route('/api/books/:id')
        .get(function (req, res){
            let bookid = req.params.id;
            //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}


            BookModel.findById(bookid, function(err, data){

                // we get an error back if the id doesn't exist
                if(err || !data) {
                    res.json('no book exists')
                } else if(data) {
                    res.send({
                        _id: data._id,
                        title: data.title,
                        comments: [...data.comments]
                    });
                };
            });
        })
        
        .post(function(req, res){
            let bookid = req.params.id;
            let comment = req.body.comment;

            BookModel.findByIdAndUpdate(bookid, { '$inc': { 'commentcount': 1 }, '$push': { 'comments': comment } }, function(err, data){
                if(err || !data) {
                    res.json('no book exists')
                } else if(comment === undefined) {
                    res.json('missing required field comment')
                } else {
                    res.send({
                        _id: data._id,
                        title: data.title,
                        comments: [...data.comments, comment]
                    })
                }
            })
            //json res format same as .get
        })
        
        .delete(function(req, res){
            let bookid = req.params.id;
            //if successful response will be 'delete successful'

            BookModel.findByIdAndDelete(bookid, function(err, removed){
                // we get an error back if the id doesn't exist
                if(!removed || err){
                    res.json('no book exists');
                } else {
                    res.json('delete successful');
                }
            })
        });
  
};
