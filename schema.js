// schema.js
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLInt,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLFloat
} from './node_modules/graphql/type';


//curl -XPOST -H 'Content-Type:application/graphql'  -d 'query Get { user(name: "david") { id } }' http://localhost:3000/graphql

function executeCommand(command) {
  var defer = Q.defer();
  var exec = require('child_process').exec;

      exec(command, null, function(error, stdout, stderr) {
          console.log('ready ' + command);
          return error 
              ? defer.reject(stderr + new Error(error.stack || error))
              : defer.resolve(stdout);
      })

      return defer.promise;
}

let PersonType = new GraphQLObjectType({
  name: 'Person',
  description: '',
  fields: () => ({
    lastName: {
      type: GraphQLString,
    },
    firstName: {
      type: GraphQLString,
    }
  })
});

let MetadataType = new GraphQLObjectType({
  name: 'Metadata',
  description: '',
  fields: () => ({
    authors: {
      type: new GraphQLList(PersonType)
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    createTime: {
      type: GraphQLString
    }
  })
});

let HistoryType = new GraphQLObjectType({
  name: 'History',
  description: '',
  fields: () => ({
    timePoints: {
      type: new GraphQLList(GraphQLString),
      description: 'the time of each item in the history'
    },
    ids: {
      type: new GraphQLList(GraphQLString),
      description: 'the ids of items at each time point'
    }
  })
});

let TagType = new GraphQLObjectType({
  name: 'Tag',
  description: '',
  fields: () => ({
    key: {
      type: GraphQLString
    },
    value: {
      type: GraphQLString
    }
  })
});

let FeatureType = new GraphQLObjectType({
  name: 'Feature',
  description: 'A functional piece of DNA',
  fields: () => ({
    start: {
      type: GraphQLInt
    },
    end: {
      type: GraphQLInt
    },
    description: {
      type: GraphQLString
    }
  })
});


let PartType = new GraphQLObjectType({
  name: 'Part',
  description: 'A functional piece of DNA',
  fields: () => ({
    id: {
      type: GraphQLString,
      description: 'universally unique id'
    },
    sequence: {
      type: GraphQLString,
      description: 'URL'
    },
    meta: {
      type: MetadataType,
      description: 'More information about this block'
    },
    tags: {
      type: new GraphQLList(TagType)
    },
    history: {
      type: HistoryType,
      description: 'The history of this part'
    },
    features: {
      type: new GraphQLList(FeatureType),
      description: 'list of sequence annotations'
    }
  })
});

let BlockType = new GraphQLObjectType({
  name: 'Block',
  description: 'A subsequence of a DNA construct or the entire construct itself',
  fields: () => ({
    id: {
      type: GraphQLString,
      description: 'universally unique id'
    },
    meta: {
      type: MetadataType,
      description: 'More information about this block'
    },
    tags: {
      type: new GraphQLList(TagType)
    },
    history: {
      type: HistoryType,
      description: 'The history of this block'
    },
    blocks: {
      type: new GraphQLList(BlockType),
      description: 'list of other blocks inside this block'
    },
    parts: {
       type: new GraphQLList(PartType),
       description: 'list of parts inside this block'
    }
  })
});

let ProjectType = new GraphQLObjectType({
  name: 'Project',
  description: '',
  fields: () => ({
    id: {
      type: GraphQLString,
      description: 'universally unique id'
    },
    meta: {
      type: MetadataType,
      description: 'More information about this project'
    },
    tags: {
      type: new GraphQLList(TagType)
    },
    history: {
      type: HistoryType,
      description: 'The history of this project'
    },
    constructs: {
      type: new GraphQLList(BlockType),
      description: 'list of constructs inside this project'
    }
  })
});

let UserType = new GraphQLObjectType({
  name: 'User',
  description: '',
  fields: () => ({
    id: {
      type: GraphQLString,
      description: 'universally unique id',
    },
    projects: {
      type: new GraphQLList(ProjectType),
      description: 'list of projects belonging to this user',
    }
  })
}); 

function updateUser(args) {
  console.log("update user");
}

function getProject(id) {
  return {
    id: "projA",
    meta: {
      authors: ["George"],
      name: "A",
      description: "Test Project"
    },
    constructs: [
      {
        id: "block1",
        meta: {},
        tags: [],
        parts: ["pTet"]
      },
      {
        id: "block2",
        meta: {},
        tags: [{type: coding}],
        blocks: [
          {
            id: "block3",
            meta: {},
            tags: [],
            parts: ["RBS1"]
          },
          {
            id: "block4",
            meta: {},
            tags: [],
            parts: ["GFP"]
          }
        ]
      }
    ]
  };
}

let RootQueryType = new GraphQLObjectType({
  name: 'GET',
  fields: {
    user: {
      type: UserType,
      args: {
        name: {
          type: GraphQLString
        }
      },
      resolve: (root, {name}) => {
        console.log(name);
        return 10;
      }
    },
    project: {
      type: ProjectType,
      resolve: (root, {id}) => {
        return getProject(id);
      }
    }
  }
});

let RootMutationType = new GraphQLObjectType({
  name: 'UPDATE',
  fields: {
    user: {
      type: UserType,
      resolve: (root, {id,name}) => {
        console.log(id + " " + name);
        return 10;
      }
    }
  }
});

let schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType
});

export default schema;