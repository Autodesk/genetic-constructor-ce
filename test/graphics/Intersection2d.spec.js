import Intersection2D from '../../src/containers/graphics/geometry/intersection2d';
import Vector2D from '../../src/containers/graphics/geometry/vector2d';
import chai from 'chai';

describe('Intersection2D', () => {

  it('should construct intersection from points or a status string', () => {

    let i = new Intersection2D('flubble bot');
    chai.expect(i.status).to.equal('flubble bot');

    i = new Intersection2D(new Vector2D(3,4));
    chai.expect(i.point.x).to.equal(3);
    chai.expect(i.point.y).to.equal(4);

  });

  it('should be able to set status', () => {

    let i = new Intersection2D();
    i.status = 'blongo';
    chai.expect(i.status).to.equal('blongo');

  });

  it('should be able to add points', () => {

    let i = new Intersection2D();
    i.add(new Vector2D(1,2));
    i.add(new Vector2D(3,4));
    i.add(new Vector2D(5,6));

    chai.expect(i.points[0].x).to.equal(1);
    chai.expect(i.points[0].y).to.equal(2);
    chai.expect(i.points[1].x).to.equal(3);
    chai.expect(i.points[1].y).to.equal(4);
    chai.expect(i.points[2].x).to.equal(5);
    chai.expect(i.points[2].y).to.equal(6);

  });

});
