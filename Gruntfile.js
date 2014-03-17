module.exports = function(grunt) {
    'use strict';
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
 
        // ファイル結合の設定
        concat: {
            dist: {
                src: [ 
                    'app/assets/javascripts/flect.connection.js', 
                    'app/assets/javascripts/flect.template.js', 
                    'app/assets/javascripts/flect.messageDialog.js', 

                    'app/scripts/intro.js' ,
                    'app/scripts/quizar.validator.js' ,
                    'app/scripts/quizar.const.js' ,
                    'app/scripts/quizar.common.js' ,
                    'app/scripts/quizar.datetime.js', 
                    'app/scripts/quizar.effectDialog.js' ,
                    'app/scripts/quizar.context.js' ,
                    'app/scripts/quizar.user.js' ,
                    'app/scripts/quizar.home.js' ,
                    'app/scripts/quizar.chat.js' ,
                    'app/scripts/quizar.makeRoom.js' ,
                    'app/scripts/quizar.questionList.js' ,
                    'app/scripts/quizar.makeQuestion.js' ,
                    'app/scripts/quizar.publishQuestion.js' ,
                    'app/scripts/quizar.entryEvent.js' ,
                    'app/scripts/quizar.editEvent.js' ,
                    'app/scripts/quizar.debug.js' ,
                    'app/scripts/quizar.app.js' ,
                    'app/scripts/outro.js' 
                ],
                dest: 'public/javascripts/<%= pkg.name %>.js'
            }
        },
 
        // ファイル圧縮の設定
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'public/javascripts/<%= pkg.name %>.js',
                dest: 'public/javascripts/<%= pkg.name %>.min.js'
            }
        },

        watch: {
            files: [
                'app/assets/javascripts/*.js',
                'app/scripts/*.js'
            ],
            tasks: ['concat', 'uglify']
        }
    });
 
    // プラグインのロード
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
 
    // デフォルトタスクの設定
    grunt.registerTask('default', [ 'concat', 'uglify', 'watch']);
 
};