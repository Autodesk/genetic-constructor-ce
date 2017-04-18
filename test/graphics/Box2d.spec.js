import Box2D from '../../src/containers/graphics/geometry/box2d';
import Vector2D from '../../src/containers/graphics/geometry/vector2d';
import {nearly} from '../../src/containers/graphics/utils';
import chai from 'chai';

describe('Box2D', () => {

  it('should make a box with various parameters', () => {
    let b = new Box2D();
    chai.expect(b.x).to.equal(0);
    chai.expect(b.y).to.equal(0);
    chai.expect(b.w).to.equal(0);
    chai.expect(b.h).to.equal(0);

    b = new Box2D(1,2,3,4);
    chai.expect(b.x).to.equal(1);
    chai.expect(b.y).to.equal(2);
    chai.expect(b.w).to.equal(3);
    chai.expect(b.h).to.equal(4);

    b = new Box2D({
      x: 1,
      y: 2,
      w: 3,
      h: 4,
    });
    chai.expect(b.x).to.equal(1);
    chai.expect(b.y).to.equal(2);
    chai.expect(b.w).to.equal(3);
    chai.expect(b.h).to.equal(4);

    b = new Box2D({
      left: 1,
      top: 2,
      width: 3,
      height: 4,
    });
    chai.expect(b.x).to.equal(1);
    chai.expect(b.y).to.equal(2);
    chai.expect(b.w).to.equal(3);
    chai.expect(b.h).to.equal(4);

  });

  it('should be able to serialize to/from a string', () => {
    let b = new Box2D(1,2,3,4);

    let b1 = Box2D.fromString(b.toString());
    chai.expect(b1.x).to.equal(1);
    chai.expect(b1.y).to.equal(2);
    chai.expect(b1.w).to.equal(3);
    chai.expect(b1.h).to.equal(4);
  });

  it('calculate the union of two boxes', () => {
    let b1 = new Box2D(100,110,100,100);
    let b2 = new Box2D(150,150,120,200);
    let b3 = b1.union(b2);

    chai.expect(b3.x).to.equal(100);
    chai.expect(b3.y).to.equal(110);
    chai.expect(b3.right).to.equal(270);
    chai.expect(b3.bottom).to.equal(350);
  });

  it('should be able to create a box from a point array', () => {
    let b = Box2D.boxFromPoints([
      new Vector2D(2, 2),
      new Vector2D(3, 3),
      new Vector2D(4, 4),
      new Vector2D(5, 5),
    ]);

    chai.expect(b.x).to.equal(2);
    chai.expect(b.y).to.equal(2);
    chai.expect(b.w).to.equal(3);
    chai.expect(b.h).to.equal(3);
  });

  it('should have accessors for all properties', () => {
    let b = new Box2D();
    b.x = 10;
    b.y = 12;
    b.w = 5;
    b.h = 6;

    chai.expect(b.x).to.equal(10);
    chai.expect(b.y).to.equal(12);

    chai.expect(b.w).to.equal(5);
    chai.expect(b.h).to.equal(6);
    chai.expect(b.width).to.equal(5);
    chai.expect(b.height).to.equal(6);

    chai.expect(b.cx).to.equal(12.5);
    chai.expect(b.cy).to.equal(15);
    chai.expect(b.center.x).to.equal(12.5);
    chai.expect(b.center.y).to.equal(15);

    chai.expect(b.right).to.equal(15);
    chai.expect(b.bottom).to.equal(18);

    chai.expect(b.topLeft.x).to.equal(10);
    chai.expect(b.topLeft.y).to.equal(12);

    chai.expect(b.topRight.x).to.equal(15);
    chai.expect(b.topRight.y).to.equal(12);

    chai.expect(b.bottomRight.x).to.equal(15);
    chai.expect(b.bottomRight.y).to.equal(18);

    chai.expect(b.bottomLeft.x).to.equal(10);
    chai.expect(b.bottomLeft.y).to.equal(18);

    b.topLeft = new Vector2D(100,200);
    chai.expect(b.x).to.equal(100);
    chai.expect(b.y).to.equal(200);

    b.x = 10;
    b.y = 10;
    b.w = 10;
    b.h = 10;
    b.topRight = new Vector2D(100,100);
    chai.expect(b.w).to.equal(90);
    chai.expect(b.h).to.equal(10);

    b.x = 10;
    b.y = 10;
    b.w = 10;
    b.h = 10;
    b.bottomRight = new Vector2D(100,100);
    chai.expect(b.w).to.equal(90);
    chai.expect(b.h).to.equal(90);

    b.x = 10;
    b.y = 10;
    b.w = 10;
    b.h = 10;
    b.bottomLeft = new Vector2D(100,100);
    chai.expect(b.w).to.equal(10);
    chai.expect(b.h).to.equal(90);

    b.x = 10;
    b.y = 10;
    b.w = 10;
    b.h = 10;
    b.center = new Vector2D(1000,1000);

    chai.expect(b.x).to.equal(995);
    chai.expect(b.y).to.equal(995);
    chai.expect(b.right).to.equal(1005);
    chai.expect(b.bottom).to.equal(1005);

  });


});
