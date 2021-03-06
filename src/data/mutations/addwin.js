/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { GraphQLList as List } from 'graphql';
import WinsItemType from '../types/WinsItemType';
import { Wins } from '../models';
import {
  GraphQLObjectType as ObjectType,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
} from 'graphql';

const addwin = {
  type: WinsItemType,
  args: {
    title: { type: new NonNull(StringType) },
    owner: { type: new NonNull(StringType) },
    img: { type: StringType },
    like: { type: IntType },
    notlike: { type: IntType },
  },
  resolve: async function(rootValue, args) {
	let winVal = Object.assign({}, args);
	await Wins.create(winVal);
	const result = await Wins.findOne({where: {title: args.title}});
	return result;
  }
}

export default addwin;
